"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { siteMeta } from "@/lib/sites";
import { formatPrice } from "@/lib/format";
import { PushToggle } from "./push-toggle";

export function NotificationsView() {
  const { rules, toggleRule, removeRule } = useStore();
  const active = rules.filter((r) => r.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Bildirimlerim</h1>
        <p className="text-muted text-sm mt-1">
          {active.length} aktif kural · stok gelince ya da fiyat düşünce haber veririz.
        </p>
      </div>

      <PushToggle />

      {rules.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-surface/60">
          <div className="text-5xl mb-3">🔔</div>
          <p className="font-semibold">Henüz bildirim kuralın yok</p>
          <p className="text-sm text-muted mt-1 mb-4">
            Bir üründe “Bildirim Aç” veya tükenmiş bir bedene tıklayarak kural oluştur.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full bg-primary text-white px-5 py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
          >
            Ürün ara
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rules.map((r) => {
            const meta = siteMeta(r.site);
            return (
              <li
                key={r.id}
                className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3"
              >
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shrink-0"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.name}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {r.productTitle}
                    {r.variantLabel ? (
                      <span className="ml-1.5 text-sm text-muted">
                        · {r.variantLabel}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted">
                    {r.triggerType === "back_in_stock"
                      ? "📦 Stok gelince"
                      : `💸 Fiyat ${r.targetPrice ? formatPrice(r.targetPrice) + " altına inince" : "düşünce"}`}
                    {" · "}
                    {r.channel === "both"
                      ? "Push + E-posta"
                      : r.channel === "push"
                        ? "Push"
                        : "E-posta"}
                  </p>
                </div>

                <button
                  onClick={() => toggleRule(r.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    r.isActive ? "bg-primary" : "bg-border"
                  }`}
                  title={r.isActive ? "Aktif" : "Pasif"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      r.isActive ? "translate-x-5" : ""
                    }`}
                  />
                </button>

                <button
                  onClick={() => removeRule(r.id)}
                  className="shrink-0 text-muted hover:text-[var(--out-stock)] px-1"
                  title="Sil"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
