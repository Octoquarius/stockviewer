import { STATUS_META } from "@/lib/format";
import type { StockStatus } from "@/lib/types";

export function StockBadge({ status }: { status: StockStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
