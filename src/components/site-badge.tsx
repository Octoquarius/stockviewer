import { siteMeta } from "@/lib/sites";

export function SiteBadge({ site }: { site: string }) {
  const meta = siteMeta(site);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {meta.name}
    </span>
  );
}
