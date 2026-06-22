"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { siteMeta } from "@/lib/sites";
import type { NotifyChannel, ProductResult, TriggerType, Variant } from "@/lib/types";

export interface NotifyTarget {
  product: ProductResult;
  variant?: Variant;
}

export function NotifyDialog({
  target,
  onClose,
}: {
  target: NotifyTarget | null;
  onClose: () => void;
}) {
  const { addRule } = useStore();
  const [trigger, setTrigger] = useState<TriggerType>("back_in_stock");
  const [channel, setChannel] = useState<NotifyChannel>("both");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (target) {
      // Tükenmiş bir bedene tıklandıysa varsayılan "stok gelince"
      setTrigger(target.variant && !target.variant.inStock ? "back_in_stock" : "back_in_stock");
      setChannel("both");
      setTargetPrice("");
      setSaved(false);
    }
  }, [target]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (target) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;

  const { product, variant } = target;
  const meta = siteMeta(product.site);
  const minPrice = Math.min(...product.variants.map((v) => v.price));

  function save() {
    addRule({
      productTitle: product.title,
      site: product.site,
      variantLabel: variant?.label,
      triggerType: trigger,
      targetPrice:
        trigger === "price_drop" && targetPrice
          ? Number(targetPrice)
          : undefined,
      channel,
      isActive: true,
    });
    setSaved(true);
    setTimeout(onClose, 900);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-surface shadow-2xl border border-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg leading-tight">🔔 Bildirim Aç</h3>
            <p className="text-sm text-muted mt-0.5">
              {product.title}
              {variant ? (
                <>
                  {" · "}
                  <span className="font-semibold text-foreground">{variant.label}</span>
                </>
              ) : null}
            </p>
          </div>
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.name}
          </span>
        </div>

        {saved ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-semibold">Bildirim kuruldu!</p>
            <p className="text-sm text-muted">Stok/fiyat değişince haber vereceğiz.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Ne zaman haber verelim?</span>
              <div className="grid grid-cols-2 gap-2">
                <TriggerBtn
                  active={trigger === "back_in_stock"}
                  onClick={() => setTrigger("back_in_stock")}
                  emoji="📦"
                  label="Stok gelince"
                />
                <TriggerBtn
                  active={trigger === "price_drop"}
                  onClick={() => setTrigger("price_drop")}
                  emoji="💸"
                  label="Fiyat düşünce"
                />
              </div>
            </div>

            {trigger === "price_drop" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Hedef fiyat (şu an {formatPrice(minPrice)})
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={`${Math.round(minPrice * 0.9)}`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                />
                <p className="text-xs text-muted">
                  Bu fiyatın altına inince bildirim göndereceğiz.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-sm font-medium">Nasıl bildirelim?</span>
              <div className="grid grid-cols-3 gap-2">
                <ChannelBtn active={channel === "push"} onClick={() => setChannel("push")} label="Push" emoji="🔔" />
                <ChannelBtn active={channel === "email"} onClick={() => setChannel("email")} label="E-posta" emoji="✉️" />
                <ChannelBtn active={channel === "both"} onClick={() => setChannel("both")} label="İkisi" emoji="✨" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 font-medium hover:bg-background"
              >
                Vazgeç
              </button>
              <button
                onClick={save}
                className="flex-1 rounded-xl bg-primary text-white py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
              >
                Bildirimi Aç
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TriggerBtn({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border py-3 text-sm font-medium flex flex-col items-center gap-1 transition-all ${
        active
          ? "border-primary bg-primary-soft text-primary-strong"
          : "border-border hover:bg-background"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      {label}
    </button>
  );
}

function ChannelBtn({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border py-2 text-xs font-medium flex flex-col items-center gap-1 transition-all ${
        active
          ? "border-secondary bg-secondary-soft text-secondary"
          : "border-border hover:bg-background"
      }`}
    >
      <span className="text-base">{emoji}</span>
      {label}
    </button>
  );
}
