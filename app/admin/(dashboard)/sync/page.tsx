import {
  cleanupMovieTitlesFromAdmin,
  syncMoviesFromAdmin,
} from "@/app/admin/actions";
import {
  AdminMetricCard,
  AdminSurface,
} from "@/components/admin/admin-surface";
import { SyncSubmitButton } from "@/components/admin/sync-submit-button";
import { Button } from "@/components/ui/button";
import { getAdminOverviewData } from "@/lib/admin-dashboard";
import { DEFAULT_SYNC_PAGE, MAX_SYNC_PAGE } from "@/lib/movie-sync";

export const dynamic = "force-dynamic";

type AdminSyncPageProps = {
  searchParams: Promise<{
    active?: string;
    created?: string;
    duplicateSkipped?: string;
    errors?: string;
    existing?: string;
    fetched?: string;
    message?: string;
    newCreated?: string;
    newErrors?: string;
    newExisting?: string;
    newFetched?: string;
    newSkippedUnsupported?: string;
    newUnchanged?: string;
    newUpdated?: string;
    page?: string;
    pages?: string;
    popularCreated?: string;
    popularErrors?: string;
    popularExisting?: string;
    popularFetched?: string;
    popularSkippedUnsupported?: string;
    popularUnchanged?: string;
    popularUpdated?: string;
    skippedUnsupported?: string;
    sync?: string;
    target?: string;
    titleChanged?: string;
    titleCleanup?: string;
    titleScanned?: string;
    titleUnchanged?: string;
    totalCreated?: string;
    totalDuplicateSkipped?: string;
    totalErrors?: string;
    totalExisting?: string;
    totalFetched?: string;
    totalSkippedUnsupported?: string;
    totalUnchanged?: string;
    totalUpdated?: string;
    unchanged?: string;
    updated?: string;
    upserted?: string;
    homeCreated?: string;
    homeErrors?: string;
    homeExisting?: string;
    homeFetched?: string;
    homeSkippedUnsupported?: string;
    homeUnchanged?: string;
    homeUpdated?: string;
  }>;
};

const FEED_BUTTONS = [
  { label: "Sync All", target: "all" },
  { label: "Sync Home", target: "home" },
  { label: "Sync Populer", target: "popular" },
  { label: "Sync New", target: "new" },
] as const;

function FeedReportRow({
  label,
  created,
  existing,
  updated,
  unchanged,
  skippedUnsupported,
  fetched,
  errors,
}: {
  label: string;
  created?: string;
  existing?: string;
  updated?: string;
  unchanged?: string;
  skippedUnsupported?: string;
  fetched?: string;
  errors?: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-xs leading-6 text-neutral-300">
        Baru: <strong>{created ?? "0"}</strong> · Sudah ada:{" "}
        <strong>{existing ?? "0"}</strong> · Update:{" "}
        <strong>{updated ?? "0"}</strong> · Tetap:{" "}
        <strong>{unchanged ?? "0"}</strong>
      </p>
      <p className="text-xs leading-6 text-neutral-400">
        Fetched: {fetched ?? "0"} · Unsupported:{" "}
        {skippedUnsupported ?? "0"} · Error: {errors ?? "0"}
      </p>
    </div>
  );
}

function SyncResultBanner({
  params,
}: {
  params: Awaited<AdminSyncPageProps["searchParams"]>;
}) {
  if (!params.sync) {
    return null;
  }

  return (
    <AdminSurface className="text-sm leading-6 text-neutral-200">
      {params.sync === "error" ? (
        <span className="text-red-200">
          Sync {params.target ?? "feed"} gagal:{" "}
          {params.message ?? "upstream tidak merespons"}
        </span>
      ) : params.target === "all" ? (
        <div className="space-y-3">
          <p className="font-semibold text-white">
            Sync semua endpoint page {params.page ?? DEFAULT_SYNC_PAGE}{" "}
            {params.sync === "partial" ? "selesai sebagian." : "selesai."}
          </p>
          {params.sync === "partial" ? (
            <p className="rounded-md border border-yellow-400/20 bg-yellow-500/10 px-3 py-2 text-xs leading-5 text-yellow-100">
              Ada endpoint yang belum selesai sempurna. Error pertama:{" "}
              {params.message ?? "upstream tidak merespons"}
            </p>
          ) : null}
          <div className="grid gap-2 lg:grid-cols-4">
            <span className="rounded-md bg-black/30 px-3 py-2">
              Total judul baru: <strong>{params.totalCreated ?? "0"}</strong>
            </span>
            <span className="rounded-md bg-black/30 px-3 py-2">
              Total judul lama: <strong>{params.totalExisting ?? "0"}</strong>
            </span>
            <span className="rounded-md bg-black/30 px-3 py-2">
              Total update: <strong>{params.totalUpdated ?? "0"}</strong>
            </span>
            <span className="rounded-md bg-black/30 px-3 py-2">
              Total tanpa perubahan:{" "}
              <strong>{params.totalUnchanged ?? "0"}</strong>
            </span>
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            <FeedReportRow
              label="Sync home"
              created={params.homeCreated}
              existing={params.homeExisting}
              updated={params.homeUpdated}
              unchanged={params.homeUnchanged}
              skippedUnsupported={params.homeSkippedUnsupported}
              fetched={params.homeFetched}
              errors={params.homeErrors}
            />
            <FeedReportRow
              label="Sync populer"
              created={params.popularCreated}
              existing={params.popularExisting}
              updated={params.popularUpdated}
              unchanged={params.popularUnchanged}
              skippedUnsupported={params.popularSkippedUnsupported}
              fetched={params.popularFetched}
              errors={params.popularErrors}
            />
            <FeedReportRow
              label="Sync new"
              created={params.newCreated}
              existing={params.newExisting}
              updated={params.newUpdated}
              unchanged={params.newUnchanged}
              skippedUnsupported={params.newSkippedUnsupported}
              fetched={params.newFetched}
              errors={params.newErrors}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-semibold text-white">
            Sync {params.target ?? "feed"} page{" "}
            {params.page ?? params.pages ?? DEFAULT_SYNC_PAGE}{" "}
            {params.sync === "partial" ? "selesai sebagian." : "selesai."}
          </p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <span className="rounded-md bg-black/30 px-3 py-2">
              Judul baru: <strong>{params.created ?? "0"}</strong>
            </span>
            <span className="rounded-md bg-black/30 px-3 py-2">
              Sudah ada: <strong>{params.existing ?? "0"}</strong>
            </span>
            <span className="rounded-md bg-black/30 px-3 py-2">
              Diperbarui: <strong>{params.updated ?? "0"}</strong>
            </span>
            <span className="rounded-md bg-black/30 px-3 py-2">
              Tanpa perubahan: <strong>{params.unchanged ?? "0"}</strong>
            </span>
          </div>
          <p className="text-xs leading-5 text-neutral-400">
            Fetched: {params.fetched ?? "0"} · Aktif page ini:{" "}
            {params.active ?? "0"} · Unsupported:{" "}
            {params.skippedUnsupported ?? "0"} · Duplikat response:{" "}
            {params.duplicateSkipped ?? "0"} · Error: {params.errors ?? "0"}
          </p>
        </div>
      )}
    </AdminSurface>
  );
}

function TitleCleanupBanner({
  params,
}: {
  params: Awaited<AdminSyncPageProps["searchParams"]>;
}) {
  if (!params.titleCleanup) {
    return null;
  }

  return (
    <AdminSurface className="text-sm leading-6 text-neutral-200">
      {params.titleCleanup === "error" ? (
        <span className="text-red-200">
          Bersihkan judul gagal: {params.message ?? "terjadi kesalahan"}
        </span>
      ) : (
        <div className="space-y-2">
          <p className="font-semibold text-white">Judul film selesai dirapikan.</p>
          <p className="text-xs leading-5 text-neutral-400">
            Dipindai: {params.titleScanned ?? "0"} · Diubah:{" "}
            {params.titleChanged ?? "0"} · Sudah rapi:{" "}
            {params.titleUnchanged ?? "0"}.
          </p>
        </div>
      )}
    </AdminSurface>
  );
}

export default async function AdminSyncPage({
  searchParams,
}: AdminSyncPageProps) {
  const params = await searchParams;
  const overview = await getAdminOverviewData();

  return (
    <div className="space-y-6">
      <AdminSurface>
        <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/15 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-200">
          Sinkronisasi katalog
        </p>
        <h1 className="mt-4 text-4xl font-black text-white">Menu sync</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-neutral-400">
          Jalankan sync per endpoint atau sekaligus. Semua laporan hasil sync
          sekarang berada di halaman ini supaya dashboard admin tetap bersih.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard label="Film home" value={overview.homeCount} />
          <AdminMetricCard label="Film populer" value={overview.popularCount} />
          <AdminMetricCard label="Film new" value={overview.newCount} />
          <AdminMetricCard label="Total film" value={overview.totalMovies} />
        </div>
      </AdminSurface>

      <SyncResultBanner params={params} />
      <TitleCleanupBanner params={params} />

      <AdminSurface>
        <p className="text-sm font-semibold text-orange-200">Sinkronisasi feed</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Jalankan per endpoint
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
          Sinkronkan metadata lokal langsung dari kategori home, populer, dan
          new. Pilih nomor page upstream yang ingin dimasukkan ke katalog.
        </p>

        <form action={syncMoviesFromAdmin} className="mt-5 space-y-4">
          <input type="hidden" name="redirectTo" value="/admin/sync" />
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-neutral-300">
              Nomor page upstream
            </label>
            <input
              name="page"
              type="number"
              min={1}
              max={MAX_SYNC_PAGE}
              defaultValue={params.page ?? params.pages ?? String(DEFAULT_SYNC_PAGE)}
              className="mt-2 h-12 w-full rounded-[18px] border border-white/10 bg-black/25 px-3 text-base text-white outline-none focus:border-orange-300"
            />
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Sekali klik hanya mengambil 1 page agar ringan. Kamu bisa isi
              page berapa pun sesuai kebutuhan.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {FEED_BUTTONS.map((item) => (
              <SyncSubmitButton
                key={item.target}
                label={item.label}
                target={item.target}
              />
            ))}
          </div>
        </form>
      </AdminSurface>

      <AdminSurface>
        <p className="text-sm font-semibold text-orange-200">Perapihan judul</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Bersihkan judul</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Rapikan judul hasil sync agar tidak membawa embel-embel SEO dari
          sumber upstream.
        </p>
        <form action={cleanupMovieTitlesFromAdmin} className="mt-4">
          <input type="hidden" name="redirectTo" value="/admin/sync" />
          <Button
            type="submit"
            variant="secondary"
            className="h-11 border border-white/10 bg-white/10 text-white hover:bg-white/15"
          >
            Bersihkan judul
          </Button>
        </form>
      </AdminSurface>
    </div>
  );
}
