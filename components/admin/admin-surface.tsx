import { cn } from "@/lib/utils";

export function AdminSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(27,18,16,0.96),rgba(14,10,9,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
