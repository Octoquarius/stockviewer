"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, getPushState } from "@/lib/push";

export function PushToggle() {
  const [state, setState] = useState<"unsupported" | "default" | "granted" | "denied">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(getPushState());
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const result = await subscribeToPush();
      setState(result);
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        ⚠️ Tarayıcın push bildirimi desteklemiyor. E-posta bildirimleri yine çalışır.
      </div>
    );
  }

  if (state === "granted") {
    return (
      <div className="rounded-2xl border border-[var(--in-stock)]/30 bg-green-50 p-4 flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div className="text-sm">
          <p className="font-semibold text-[var(--in-stock)]">Tarayıcı bildirimleri açık</p>
          <p className="text-muted">Stok/fiyat değişince anında haber alacaksın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4 flex items-center gap-3">
      <span className="text-xl">🔕</span>
      <div className="text-sm flex-1">
        <p className="font-semibold">Tarayıcı bildirimlerini aç</p>
        <p className="text-muted">
          {state === "denied"
            ? "İzin reddedilmiş — tarayıcı ayarlarından açabilirsin."
            : "Site kapalıyken bile stok gelince bildirim al."}
        </p>
      </div>
      <button
        onClick={enable}
        disabled={busy || state === "denied"}
        className="rounded-full bg-primary text-white px-4 py-2 text-sm font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong disabled:opacity-50"
      >
        {busy ? "…" : "İzin Ver"}
      </button>
    </div>
  );
}
