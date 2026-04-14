"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Gift,
  Megaphone,
  RefreshCw,
  Share2,
  Wallet,
} from "lucide-react";

import {
  requestAffiliatePayoutAction,
  recordAffiliateInteractionAction,
  type AffiliateActionState,
} from "@/app/affiliate/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AffiliateActivityItem = {
  amountLabel?: string | null;
  createdAtLabel: string;
  description: string;
  id: string;
  title: string;
};

type AffiliatePayoutItem = {
  amountLabel: string;
  createdAtLabel: string;
  id: string;
  statusLabel: string;
};

type AffiliateDashboardProps = {
  activeReferrals: number;
  activities: AffiliateActivityItem[];
  availableBalance: number;
  availableBalanceLabel: string;
  canRequestPayout: boolean;
  clicks: number;
  minimumWithdrawLabel: string;
  payouts: AffiliatePayoutItem[];
  pendingBalanceLabel: string;
  referralCode: string;
  referralUrl: string;
  signups: number;
  totalCommissionLabel: string;
  withdrawnBalanceLabel: string;
};

const initialActionState: AffiliateActionState = {};

function StatChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/55">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

export function AffiliateDashboard({
  activeReferrals,
  activities,
  availableBalance,
  availableBalanceLabel,
  canRequestPayout,
  clicks,
  minimumWithdrawLabel,
  payouts,
  pendingBalanceLabel,
  referralCode,
  referralUrl,
  signups,
  totalCommissionLabel,
  withdrawnBalanceLabel,
}: AffiliateDashboardProps) {
  const [actionState, payoutAction, isPayoutPending] = React.useActionState(
    requestAffiliatePayoutAction,
    initialActionState,
  );
  const [link, setLink] = React.useState(referralUrl);
  const [copied, setCopied] = React.useState(false);
  const [shareFeedback, setShareFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLink(referralUrl);
  }, [referralUrl]);

  React.useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  React.useEffect(() => {
    if (!shareFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShareFeedback(null), 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareFeedback]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setShareFeedback("Link affiliate berhasil disalin.");
      void recordAffiliateInteractionAction("copy_link");
    } catch {
      setShareFeedback("Clipboard belum bisa dipakai di perangkat ini.");
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          text: "Buka Mini App Box Office dari link Telegram ini.",
          title: "Box Office Telegram Affiliate",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
      }

      setShareFeedback("Link affiliate siap dibagikan.");
      void recordAffiliateInteractionAction("share_link");
    } catch {
      setShareFeedback("Bagikan link belum bisa dijalankan sekarang.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,#ff7a1a_0%,#f04d23_34%,#120b09_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/75">
                Referral Box Office
              </p>
              <h1 className="mt-2 text-3xl font-black leading-none text-white">
                {availableBalanceLabel}
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Saldo yang siap kamu arahkan ke penarikan berikutnya.
              </p>
            </div>
            <span className="rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">
              Kode {referralCode}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatChip label="Klik" value={String(clicks)} />
            <StatChip label="Signup" value={String(signups)} />
            <StatChip label="Aktif" value={String(activeReferrals)} />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.94),rgba(8,8,8,0.96))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Link referral Telegram
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              Arahkan orang langsung ke bot dan Mini App Box Office dari link
              ini.
            </p>
          </div>
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-200 ring-1 ring-red-400/10">
            Live
          </span>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/10 bg-black/25 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            Deep link
          </p>
          <p className="mt-2 break-all text-sm leading-6 text-white">{link}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={copyLink}
            className="h-11 border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Tersalin" : "Salin"}
          </Button>
          <Button
            type="button"
            onClick={shareLink}
            className="h-11 bg-red-600 text-white hover:bg-red-500"
          >
            <Share2 className="size-4" />
            Bagikan
          </Button>
        </div>

        {shareFeedback ? (
          <p className="mt-3 text-sm text-neutral-300">{shareFeedback}</p>
        ) : null}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            Total komisi
          </p>
          <p className="mt-2 text-lg font-bold text-white">
            {totalCommissionLabel}
          </p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            Pending
          </p>
          <p className="mt-2 text-lg font-bold text-white">
            {pendingBalanceLabel}
          </p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            Sudah cair
          </p>
          <p className="mt-2 text-lg font-bold text-white">
            {withdrawnBalanceLabel}
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,20,20,0.9),rgba(8,8,8,0.96))] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-white">Tarik saldo</p>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              Minimum penarikan {minimumWithdrawLabel}. Saat diajukan, saldo akan
              dipindahkan ke status pending.
            </p>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 ring-1 ring-white/10">
            <Wallet className="mr-1 inline size-3.5" />
            Withdraw
          </span>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            Siap ditarik
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {availableBalanceLabel}
          </p>
        </div>

        <form action={payoutAction} className="mt-4">
          <input type="hidden" name="amount" value={availableBalance} />
          <Button
            type="submit"
            disabled={!canRequestPayout || isPayoutPending}
            className="h-12 w-full bg-red-600 text-white hover:bg-red-500"
          >
            {isPayoutPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Gift className="size-4" />
            )}
            {canRequestPayout ? "Ajukan penarikan" : "Saldo belum cukup"}
          </Button>
        </form>

        {actionState.error ? (
          <p className="mt-3 rounded-md border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-100">
            {actionState.error}
          </p>
        ) : null}
        {actionState.success ? (
          <p className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {actionState.success}
          </p>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,18,0.92),rgba(8,8,8,0.96))] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-white">Aktivitas terbaru</p>
            <p className="mt-1 text-sm text-neutral-400">
              Semua perkembangan affiliate kamu akan muncul di sini.
            </p>
          </div>
          <Megaphone className="size-5 text-neutral-500" />
        </div>

        <div className="mt-4 space-y-3">
          {activities.length ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-neutral-400">
                      {activity.description}
                    </p>
                  </div>
                  {activity.amountLabel ? (
                    <span className="text-sm font-semibold text-emerald-300">
                      {activity.amountLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  {activity.createdAtLabel}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <p className="text-sm font-semibold text-white">
                Belum ada aktivitas
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Mulai dengan menyalin atau membagikan link affiliate kamu.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,18,0.92),rgba(8,8,8,0.96))] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-white">Riwayat penarikan</p>
            <p className="mt-1 text-sm text-neutral-400">
              Status semua pengajuan pencairan affiliate.
            </p>
          </div>
          <ArrowUpRight className="size-5 text-neutral-500" />
        </div>

        <div className="mt-4 space-y-3">
          {payouts.length ? (
            payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {payout.amountLabel}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {payout.createdAtLabel}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold ring-1",
                    payout.statusLabel === "Pending"
                      ? "bg-yellow-500/10 text-yellow-200 ring-yellow-400/20"
                      : payout.statusLabel === "Dibayar"
                        ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/20"
                        : "bg-white/5 text-neutral-300 ring-white/10",
                  )}
                >
                  {payout.statusLabel}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <p className="text-sm font-semibold text-white">
                Belum ada penarikan
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Saat saldo kamu cukup, pengajuan penarikan akan muncul di sini.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
