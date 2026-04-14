import {
  AdminMetricCard,
  AdminSurface,
} from "@/components/admin/admin-surface";
import { Button } from "@/components/ui/button";
import { updateAffiliateProgramSettings, updateTelegramBotSettings } from "@/app/admin/actions";
import {
  getAffiliateProfileCountSafe,
  getAffiliateProgramSettingsSafe,
} from "@/lib/affiliate";
import { getTelegramBotSettingsSafe } from "@/lib/telegram-bot-settings";

export const dynamic = "force-dynamic";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    applyToExisting?: string;
    bot?: string;
    message?: string;
    rate?: string;
    settings?: string;
  }>;
};

function PreviewButton({
  label,
}: {
  label: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-[#253140] px-4 py-3 text-center text-sm font-semibold text-white">
      {label}
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: "text" | "url";
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-[18px] border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-neutral-500"
      />
    </div>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const params = await searchParams;
  const [affiliateSettingsResult, profilesResult, telegramSettingsResult] =
    await Promise.all([
      getAffiliateProgramSettingsSafe(),
      getAffiliateProfileCountSafe(),
      getTelegramBotSettingsSafe(),
    ]);

  const affiliateSettings = affiliateSettingsResult.settings;
  const telegramSettings = telegramSettingsResult.settings;
  const affiliateSchemaReady =
    affiliateSettingsResult.schemaReady && profilesResult.schemaReady;
  const affiliateSchemaIssue =
    affiliateSettingsResult.schemaIssue ?? profilesResult.schemaIssue;

  return (
    <div className="space-y-6">
      <AdminSurface>
        <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/15 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-200">
          Telegram bot
        </p>
        <h1 className="mt-4 text-4xl font-black text-white">
          Konfigurasi bot dan Mini App
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-neutral-400">
          Atur pesan sambutan bot, inline keyboard saat `/start`, dan link
          penting yang langsung dipakai webhook Telegram. Tidak ada pengaturan
          SEO di sini karena flow utamanya native di Telegram.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Schema bot"
            value={telegramSettingsResult.schemaReady ? "Aktif" : "Fallback"}
          />
          <AdminMetricCard
            label="Tombol utama"
            value={telegramSettings.openAppLabel}
          />
          <AdminMetricCard
            label="Tombol affiliate"
            value={telegramSettings.affiliateLabel}
          />
          <AdminMetricCard
            label="Presentase affiliate"
            value={`${affiliateSettings.defaultCommissionRate}%`}
          />
        </div>
      </AdminSurface>

      {params.bot ? (
        <AdminSurface className="text-sm leading-6 text-neutral-200">
          {params.bot === "error" ? (
            <span className="text-red-200">
              {params.message ?? "Pengaturan bot gagal diperbarui."}
            </span>
          ) : (
            <span className="text-emerald-100">
              {params.message ?? "Pengaturan bot berhasil diperbarui."}
            </span>
          )}
        </AdminSurface>
      ) : null}

      {!telegramSettingsResult.schemaReady ? (
        <AdminSurface className="text-sm leading-6 text-amber-100">
          <p className="font-semibold text-white">Bot settings belum aktif penuh</p>
          <p className="mt-2">
            {telegramSettingsResult.schemaIssue ??
              "Database runtime belum memiliki tabel Telegram bot settings terbaru."}
          </p>
        </AdminSurface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <AdminSurface>
          <p className="text-sm font-semibold text-orange-200">
            Sambutan bot online
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Atur pesan `/start` dan tombol inline
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Gunakan placeholder <code className="rounded bg-black/30 px-1.5 py-0.5 text-neutral-200">{`{first_name}`}</code> atau{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-neutral-200">{`{username}`}</code> di pesan sambutan.
          </p>

          <form action={updateTelegramBotSettings} className="mt-6 space-y-6">
            <input type="hidden" name="redirectTo" value="/admin/settings" />

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Pesan sambutan bot
              </label>
              <textarea
                name="welcomeMessage"
                defaultValue={telegramSettings.welcomeMessage}
                rows={12}
                className="mt-2 w-full rounded-[20px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-neutral-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                defaultValue={telegramSettings.openAppLabel}
                label="Tombol buka"
                name="openAppLabel"
              />
              <Field
                defaultValue={telegramSettings.openAppUrl}
                label="URL tombol buka"
                name="openAppUrl"
                type="url"
              />
              <Field
                defaultValue={telegramSettings.searchLabel}
                label="Tombol cari judul"
                name="searchLabel"
              />
              <Field
                defaultValue={telegramSettings.searchUrl}
                label="URL tombol cari"
                name="searchUrl"
                type="url"
              />
              <Field
                defaultValue={telegramSettings.affiliateLabel}
                label="Tombol affiliate"
                name="affiliateLabel"
              />
              <Field
                defaultValue={telegramSettings.affiliateUrl}
                label="URL tombol affiliate"
                name="affiliateUrl"
                type="url"
              />
              <Field
                defaultValue={telegramSettings.affiliateGroupLabel}
                label="Channel / grup affiliate"
                name="affiliateGroupLabel"
              />
              <Field
                defaultValue={telegramSettings.affiliateGroupUrl}
                label="URL grup affiliate"
                name="affiliateGroupUrl"
                type="url"
              />
              <Field
                defaultValue={telegramSettings.channelLabel}
                label="Channel film"
                name="channelLabel"
              />
              <Field
                defaultValue={telegramSettings.channelUrl}
                label="URL channel film"
                name="channelUrl"
                type="url"
              />
              <Field
                defaultValue={telegramSettings.supportLabel}
                label="Support admin"
                name="supportLabel"
              />
              <Field
                defaultValue={telegramSettings.supportUrl}
                label="URL support admin"
                name="supportUrl"
                type="url"
              />
              <Field
                defaultValue={telegramSettings.vipLabel}
                label="Tombol VIP"
                name="vipLabel"
              />
              <Field
                defaultValue={telegramSettings.vipUrl}
                label="URL tombol VIP"
                name="vipUrl"
                type="url"
              />
            </div>

            <Button
              type="submit"
              className="h-11 bg-red-600 text-white hover:bg-red-500"
            >
              Simpan pengaturan Telegram
            </Button>
          </form>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <p className="text-sm font-semibold text-orange-200">
              Preview keyboard
            </p>
            <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-[#1f2c3a] p-4">
              <div className="rounded-[18px] bg-[#2c3947] p-4 text-sm leading-7 text-white">
                {telegramSettings.welcomeMessage
                  .replace(/\{first_name\}/gi, "Aan Hendri")
                  .replace(/\{username\}/gi, "@aanhendri")}
              </div>
              <PreviewButton label={telegramSettings.openAppLabel} />
              <PreviewButton label={telegramSettings.searchLabel} />
              <PreviewButton label={telegramSettings.affiliateLabel} />
              <div className="grid grid-cols-2 gap-2">
                <PreviewButton label={telegramSettings.affiliateGroupLabel} />
                <PreviewButton label={telegramSettings.channelLabel} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PreviewButton label={telegramSettings.supportLabel} />
                <PreviewButton label={telegramSettings.vipLabel} />
              </div>
            </div>
          </AdminSurface>

          <AdminSurface>
            <p className="text-sm font-semibold text-orange-200">
              Pengaturan affiliate
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Presentase komisi default
            </h2>
            {!affiliateSchemaReady ? (
              <p className="mt-3 text-sm leading-6 text-amber-100">
                {affiliateSchemaIssue ??
                  "Database runtime belum siap untuk setting affiliate."}
              </p>
            ) : (
              <form
                action={updateAffiliateProgramSettings}
                className="mt-5 space-y-5"
              >
                <input type="hidden" name="redirectTo" value="/admin/settings" />
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    Presentase komisi default
                  </label>
                  <div className="mt-2 flex items-center rounded-[18px] border border-white/10 bg-black/25 px-4">
                    <input
                      name="defaultCommissionRate"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={affiliateSettings.defaultCommissionRate}
                      className="h-12 w-full bg-transparent text-base text-white outline-none"
                    />
                    <span className="text-sm font-semibold text-neutral-400">
                      %
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <input
                    name="applyToExisting"
                    type="checkbox"
                    className="mt-1 size-4 rounded border-white/20 bg-black"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      Terapkan juga ke semua profil affiliate yang sudah ada
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-neutral-400">
                      Saat rate global berubah, semua profil lama bisa ikut
                      disesuaikan dari sini.
                    </span>
                  </span>
                </label>

                <Button
                  type="submit"
                  className="h-11 bg-red-600 text-white hover:bg-red-500"
                >
                  Simpan presentase
                </Button>
              </form>
            )}
          </AdminSurface>
        </div>
      </div>
    </div>
  );
}
