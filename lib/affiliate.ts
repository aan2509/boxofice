import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export const AFFILIATE_MINIMUM_WITHDRAW = 50_000;

type AffiliateUser = {
  id: string;
  name: string;
};

function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase();
}

function referralBaseFromName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  return cleaned.slice(0, 6) || "BOX";
}

async function generateUniqueReferralCode(name: string) {
  const base = referralBaseFromName(name);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const referralCode = `${base}${suffix}`;
    const exists = await prisma.affiliateProfile.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!exists) {
      return referralCode;
    }
  }

  return `${base}${Date.now().toString(36).toUpperCase()}`;
}

export function getAffiliateSharePath(referralCode: string) {
  return `/r/${encodeURIComponent(referralCode)}`;
}

export async function ensureAffiliateProfile(user: AffiliateUser) {
  const existing = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  const referralCode = await generateUniqueReferralCode(user.name);

  return prisma.affiliateProfile.create({
    data: {
      minimumWithdraw: AFFILIATE_MINIMUM_WITHDRAW,
      referralCode,
      userId: user.id,
    },
    select: { id: true },
  });
}

export async function getAffiliateDashboard(user: AffiliateUser) {
  const profile = await ensureAffiliateProfile(user);

  return prisma.affiliateProfile.findUniqueOrThrow({
    where: { id: profile.id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      payoutRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      referrals: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          activatedAt: true,
          commissionEarned: true,
          createdAt: true,
          id: true,
          referredUser: {
            select: {
              name: true,
            },
          },
          status: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function recordAffiliateInteraction(input: {
  type: "copy_link" | "share_link";
  userId: string;
}) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });

  if (!profile) {
    return null;
  }

  const config =
    input.type === "copy_link"
      ? {
          description: "Link referral berhasil disalin dari dashboard affiliate.",
          title: "Link affiliate disalin",
        }
      : {
          description: "Link referral dibagikan dari dashboard affiliate.",
          title: "Link affiliate dibagikan",
        };

  return prisma.affiliateActivity.create({
    data: {
      description: config.description,
      profileId: profile.id,
      title: config.title,
      type: input.type,
    },
    select: { id: true },
  });
}

export async function registerAffiliateClick(referralCode: string) {
  const normalizedCode = normalizeReferralCode(referralCode);
  const profile = await prisma.affiliateProfile.findUnique({
    where: { referralCode: normalizedCode },
    select: { id: true },
  });

  if (!profile) {
    return null;
  }

  await prisma.affiliateProfile.update({
    where: { id: profile.id },
    data: {
      totalClicks: {
        increment: 1,
      },
    },
  });

  return profile.id;
}

export async function attachAffiliateReferral(input: {
  referralCode?: string | null;
  referredUserId: string;
}) {
  const normalizedCode = input.referralCode
    ? normalizeReferralCode(input.referralCode)
    : "";

  if (!normalizedCode) {
    return null;
  }

  const profile = await prisma.affiliateProfile.findUnique({
    where: { referralCode: normalizedCode },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!profile || profile.userId === input.referredUserId) {
    return null;
  }

  const existingReferral = await prisma.affiliateReferral.findUnique({
    where: { referredUserId: input.referredUserId },
    select: { id: true },
  });

  if (existingReferral) {
    return existingReferral;
  }

  const referral = await prisma.$transaction(async (tx) => {
    const createdReferral = await tx.affiliateReferral.create({
      data: {
        profileId: profile.id,
        referredUserId: input.referredUserId,
      },
      select: { id: true },
    });

    await tx.affiliateProfile.update({
      where: { id: profile.id },
      data: {
        totalSignups: {
          increment: 1,
        },
      },
    });

    await tx.affiliateActivity.create({
      data: {
        description:
          "Satu user baru membuat akun lewat link affiliate kamu. Komisi akan aktif saat referral berlangganan.",
        profileId: profile.id,
        title: "Referral baru mendaftar",
        type: "referral_signup",
      },
    });

    return createdReferral;
  });

  return referral;
}

export async function requestAffiliatePayout(input: {
  amount: number;
  userId: string;
}) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId: input.userId },
    select: {
      availableBalance: true,
      id: true,
      minimumWithdraw: true,
      payoutRequests: {
        where: {
          status: "pending",
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!profile) {
    throw new Error("Profil affiliate belum tersedia.");
  }

  if (profile.payoutRequests.length > 0) {
    throw new Error("Masih ada permintaan penarikan yang sedang diproses.");
  }

  const amount = Math.trunc(input.amount);

  if (amount < profile.minimumWithdraw) {
    throw new Error("Saldo belum memenuhi minimum penarikan.");
  }

  if (amount > profile.availableBalance) {
    throw new Error("Saldo yang bisa ditarik tidak mencukupi.");
  }

  const payout = await prisma.$transaction(async (tx) => {
    const createdPayout = await tx.affiliatePayoutRequest.create({
      data: {
        amount,
        profileId: profile.id,
      },
      select: {
        amount: true,
        id: true,
      },
    });

    await tx.affiliateProfile.update({
      where: { id: profile.id },
      data: {
        availableBalance: {
          decrement: amount,
        },
        pendingBalance: {
          increment: amount,
        },
      },
    });

    await tx.affiliateActivity.create({
      data: {
        amount,
        description:
          "Permintaan penarikan baru sudah masuk dan menunggu pengecekan admin.",
        profileId: profile.id,
        title: "Penarikan diajukan",
        type: "payout_requested",
      },
    });

    return createdPayout;
  });

  return payout;
}
