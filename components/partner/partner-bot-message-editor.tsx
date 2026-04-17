"use client";

import * as React from "react";

import { savePartnerBotSettingsAction } from "@/app/partner-bot/actions";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { cn } from "@/lib/utils";

type InlineButtonInput = {
  enabled: boolean;
  id: string;
  label: string;
  url: string;
};

type PartnerBotMessageEditorProps = {
  botId: string;
  botName: string;
  currentSettingsLabel: string;
  currentWelcomeMessage: string;
  defaultWelcomeMessage: string;
  initialButtons: InlineButtonInput[];
  previewDescription: string;
  previewHost: string;
  settingsButtonLabel: string;
};

function PreviewButton({
  fullWidth,
  label,
}: {
  fullWidth?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-white/10 bg-[#253140] px-4 py-3 text-center text-sm font-semibold text-white",
        fullWidth && "col-span-full",
      )}
    >
      {label}
    </div>
  );
}

export function PartnerBotMessageEditor({
  botId,
  botName,
  currentSettingsLabel,
  currentWelcomeMessage,
  defaultWelcomeMessage,
  initialButtons,
  previewDescription,
  previewHost,
  settingsButtonLabel,
}: PartnerBotMessageEditorProps) {
  const [welcomeMessage, setWelcomeMessage] = React.useState(
    currentWelcomeMessage,
  );
  const [ownerSettingsLabel, setOwnerSettingsLabel] = React.useState(
    currentSettingsLabel,
  );
  const [buttons, setButtons] = React.useState<InlineButtonInput[]>(
    initialButtons,
  );

  const previewRows = React.useMemo(() => {
    const rows: InlineButtonInput[][] = [];

    for (let index = 0; index < buttons.length; index += 2) {
      const row = buttons
        .slice(index, index + 2)
        .filter((button) => button.enabled && button.label.trim() && button.url.trim());

      if (row.length) {
        rows.push(row);
      }
    }

    return rows;
  }, [buttons]);

  function updateButton(
    index: number,
    patch: Partial<InlineButtonInput>,
  ) {
    setButtons((current) =>
      current.map((button, buttonIndex) =>
        buttonIndex === index ? { ...button, ...patch } : button,
      ),
    );
  }

  const previewMessage = welcomeMessage
    .replace(/\{first_name\}/gi, "Zen Kusuma")
    .replace(/\{username\}/gi, "@zenkusuma")
    .replace(/\{bot_name\}|\{nama bot\}|\{nama_bot\}|\{brand_name\}|\{app_name\}/gi, botName);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
      <form
        action={savePartnerBotSettingsAction}
        className="space-y-5 rounded-[24px] border border-white/10 bg-black/20 p-5"
      >
        <input type="hidden" name="partnerBotId" value={botId} />

        <div>
          <label className="block text-sm font-medium text-neutral-300">
            Pesan sambutan
          </label>
          <textarea
            name="welcomeMessage"
            value={welcomeMessage}
            onChange={(event) => setWelcomeMessage(event.target.value)}
            rows={8}
            className="mt-2 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-neutral-600"
          />
          <p className="mt-2 text-xs leading-6 text-neutral-500">
            Kosongkan untuk pakai global. Placeholder:{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-neutral-300">{`{first_name}`}</code>,{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-neutral-300">{`{username}`}</code>,{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-neutral-300">{`{bot_name}`}</code>.
          </p>
          <p className="mt-1 text-xs leading-6 text-neutral-500">
            Default global sekarang: <span className="text-neutral-300">{defaultWelcomeMessage}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">
            Label tombol setting khusus owner
          </label>
          <input
            name="settingsLabel"
            value={ownerSettingsLabel}
            onChange={(event) => setOwnerSettingsLabel(event.target.value)}
            className="mt-2 h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-neutral-600"
            placeholder="Mis. ⚙️ Setting bot"
          />
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Tombol ini hanya muncul untuk owner bot.
          </p>
        </div>

        <div className="space-y-4">
          {buttons.map((button, index) => (
            <div
              key={button.id}
              className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Tombol {index + 1}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Baris {Math.floor(index / 2) + 1} · Posisi{" "}
                    {index % 2 === 0 ? "kiri" : "kanan"}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-300">
                  <input
                    type="checkbox"
                    name={`buttonEnabled_${index + 1}`}
                    checked={button.enabled}
                    onChange={(event) =>
                      updateButton(index, { enabled: event.target.checked })
                    }
                    className="size-4 rounded border-white/20 bg-transparent text-red-500 focus:ring-red-500"
                  />
                  Aktif
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    Label tombol
                  </label>
                  <input
                    name={`buttonLabel_${index + 1}`}
                    value={button.label}
                    onChange={(event) =>
                      updateButton(index, { label: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    URL tombol
                  </label>
                  <input
                    name={`buttonUrl_${index + 1}`}
                    type="url"
                    value={button.url}
                    onChange={(event) =>
                      updateButton(index, { url: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-neutral-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <PendingSubmitButton
          pendingLabel="Menyimpan..."
          className="h-12 w-full bg-red-600 text-white hover:bg-red-500"
        >
          Simpan pengaturan bot
        </PendingSubmitButton>
      </form>

      <section className="rounded-[24px] border border-white/10 bg-[#1f2c3a] p-4">
        <p className="text-sm font-semibold text-orange-200">Live preview</p>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Preview bot
          </p>
          <p className="mt-3 text-lg font-semibold text-white">{botName}</p>
          <p className="mt-2 text-sm text-orange-200">{previewHost}</p>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            {previewDescription}
          </p>
        </div>

        <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-[#1f2c3a]">
          <div className="rounded-[18px] bg-[#2c3947] p-4 text-sm leading-7 text-white">
            {previewMessage}
          </div>

          {previewRows.map((row, index) => (
            <div
              key={`preview-row-${index}`}
              className={cn(
                "grid gap-2",
                row.length === 1 ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {row.map((button) => (
                <PreviewButton
                  key={button.id}
                  label={button.label}
                  fullWidth={row.length === 1}
                />
              ))}
            </div>
          ))}

          <div className="grid grid-cols-1 gap-2 pt-1">
            <PreviewButton label={settingsButtonLabel || ownerSettingsLabel || "⚙️ Setting bot"} fullWidth />
          </div>
        </div>
      </section>
    </div>
  );
}
