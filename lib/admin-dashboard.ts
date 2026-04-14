import { prisma } from "@/lib/prisma";
import { ensureAffiliateProgramSettings } from "@/lib/affiliate";

export async function getAdminOverviewData() {
  const [
    totalMovies,
    homeCount,
    popularCount,
    newCount,
    totalUsers,
    totalFavorites,
    totalHistory,
    totalAffiliateProfiles,
  ] = await Promise.all([
    prisma.movie.count(),
    prisma.movie.count({ where: { inHome: true } }),
    prisma.movie.count({ where: { inPopular: true } }),
    prisma.movie.count({ where: { inNew: true } }),
    prisma.user.count(),
    prisma.userFavorite.count(),
    prisma.watchHistory.count(),
    prisma.affiliateProfile.count(),
  ]);

  return {
    homeCount,
    newCount,
    popularCount,
    totalAffiliateProfiles,
    totalFavorites,
    totalHistory,
    totalMovies,
    totalUsers,
  };
}

export async function getAdminUserTableData(query: string | undefined) {
  const settings = await ensureAffiliateProgramSettings();
  const trimmedQuery = query?.trim();

  const users = await prisma.user.findMany({
    where: trimmedQuery
      ? {
          OR: [
            {
              email: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              affiliateProfile: {
                is: {
                  referralCode: {
                    contains: trimmedQuery.toUpperCase(),
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      email: true,
      id: true,
      name: true,
      _count: {
        select: {
          favorites: true,
          sessions: true,
          watchHistory: true,
        },
      },
      affiliateProfile: {
        select: {
          activeReferrals: true,
          availableBalance: true,
          commissionRate: true,
          referralCode: true,
          totalCommission: true,
        },
      },
      affiliateReferral: {
        select: {
          profile: {
            select: {
              referralCode: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    take: 100,
  });

  return {
    defaultCommissionRate: settings.defaultCommissionRate,
    totalUsers: users.length,
    users,
  };
}
