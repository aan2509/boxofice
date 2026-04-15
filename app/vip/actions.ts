"use server";

import { redirect } from "next/navigation";

import { requireUserSession } from "@/lib/user-auth";
import {
  createVipPaymentForUser,
  syncVipOrderFromPaymenkuStatus,
} from "@/lib/vip-checkout";

export async function startVipPayment(formData: FormData) {
  const user = await requireUserSession();
  const channelCode = String(formData.get("channelCode") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();
  const planQuery = encodeURIComponent(planId);
  const channelQuery = channelCode
    ? `&channel=${encodeURIComponent(channelCode)}`
    : "";

  if (!planId) {
    redirect("/vip?payment=error&message=Paket+VIP+belum+dipilih.");
  }

  if (!channelCode) {
    redirect(
      `/vip?plan=${planQuery}&payment=error&message=Metode+pembayaran+belum+dipilih.`,
    );
  }

  let orderId = "";

  try {
    orderId = await createVipPaymentForUser({
      channelCode,
      planId,
      userId: user.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Pembayaran VIP belum bisa dijalankan sekarang.";

    redirect(
      `/vip?plan=${planQuery}${channelQuery}&payment=error&message=${encodeURIComponent(message)}`,
    );
  }

  redirect(`/vip/pay/${orderId}`);
}

export async function checkVipPaymentStatus(formData: FormData) {
  const user = await requireUserSession();
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    redirect("/vip?payment=error&message=Order+pembayaran+tidak+ditemukan.");
  }

  let status = "";

  try {
    const result = await syncVipOrderFromPaymenkuStatus({
      orderId,
      userId: user.id,
    });

    status = result.status;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Status pembayaran belum bisa dicek sekarang.";

    redirect(
      `/vip/pay/${encodeURIComponent(orderId)}?status=error&message=${encodeURIComponent(message)}`,
    );
  }

  if (status === "paid") {
    redirect(`/vip/success?orderId=${encodeURIComponent(orderId)}`);
  }

  redirect(
    `/vip/pay/${encodeURIComponent(orderId)}?status=${encodeURIComponent(status)}&message=${encodeURIComponent("Status pembayaran sudah diperbarui.")}`,
  );
}
