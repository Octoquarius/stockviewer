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
        ⚠️ Your browser doesn&apos;t support push notifications. Email notifications will still work.
      </div>
    );
  }

  if (state === "granted") {
    return (
      <div className="rounded-2xl border border-[var(--in-stock)]/30 bg-green-50 p-4 flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div className="text-sm">
          <p className="font-semibold text-[var(--in-stock)]">Browser notifications are on</p>
          <p className="text-muted">You&apos;ll get notified instantly when stock or price changes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4 flex items-center gap-3">
      <span className="text-xl">🔕</span>
      <div className="text-sm flex-1">
        <p className="font-semibold">Turn on browser notifications</p>
        <p className="text-muted">
          {state === "denied"
            ? "Permission was denied — you can enable it from your browser settings."
            : "Get notified when stock arrives, even while the site is closed."}
        </p>
      </div>
      <button
        onClick={enable}
        disabled={busy || state === "denied"}
        className="rounded-full bg-primary text-white px-4 py-2 text-sm font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong disabled:opacity-50"
      >
        {busy ? "…" : "Allow"}
      </button>
    </div>
  );
}
