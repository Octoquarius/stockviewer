"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  NotificationRule,
  ProductResult,
  TrackedProduct,
  Variant,
} from "@/lib/types";
import { useAuth } from "@/lib/auth";

// Hibrit kalıcılık:
//  - Supabase yapılandırılmış + kullanıcı girişli  → Postgres (RLS ile)
//  - değilse                                        → tarayıcı localStorage (demo)
// useStore() arayüzü her iki durumda da aynıdır.

const PRODUCTS_KEY = "stockviewer.tracked";
const RULES_KEY = "stockviewer.rules";

interface StoreState {
  tracked: TrackedProduct[];
  rules: NotificationRule[];
  isTracked: (site: string, title: string) => boolean;
  track: (result: ProductResult) => void;
  untrack: (id: string) => void;
  addRule: (rule: Omit<NotificationRule, "id" | "createdAt">) => void;
  toggleRule: (id: string) => void;
  removeRule: (id: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useAuth();
  const dbMode = Boolean(supabase && user);

  const [tracked, setTracked] = useState<TrackedProduct[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // --- Yükleme ---
  useEffect(() => {
    let active = true;
    async function loadAll() {
      if (dbMode && supabase && user) {
        const { data: products } = await supabase
          .from("products")
          .select("id,site,title,image_url,product_url,category,brand,currency,created_at,variants(variant_type,variant_label,in_stock,stock_count,price)")
          .order("created_at", { ascending: false });

        const mapped: TrackedProduct[] = (products ?? []).map((p: DbProduct) => ({
          id: p.id,
          addedAt: p.created_at,
          result: {
            site: p.site,
            title: p.title,
            imageUrl: p.image_url ?? "",
            productUrl: p.product_url ?? "",
            category: p.category,
            brand: p.brand ?? undefined,
            currency: p.currency,
            variants: (p.variants ?? []).map((v) => ({
              type: v.variant_type,
              label: v.variant_label,
              inStock: v.in_stock,
              stockCount: v.stock_count ?? undefined,
              price: Number(v.price),
            })),
          },
        }));

        const { data: notifs } = await supabase
          .from("notifications")
          .select("id,product_title,site,variant_label,trigger_type,target_price,channel,is_active,created_at")
          .order("created_at", { ascending: false });

        const mappedRules: NotificationRule[] = (notifs ?? []).map((n: DbNotif) => ({
          id: n.id,
          productTitle: n.product_title,
          site: n.site,
          variantLabel: n.variant_label ?? undefined,
          triggerType: n.trigger_type,
          targetPrice: n.target_price ?? undefined,
          channel: n.channel,
          isActive: n.is_active,
          createdAt: n.created_at,
        }));

        if (active) {
          setTracked(mapped);
          setRules(mappedRules);
          setHydrated(true);
        }
      } else {
        if (active) {
          setTracked(load<TrackedProduct[]>(PRODUCTS_KEY, []));
          setRules(load<NotificationRule[]>(RULES_KEY, []));
          setHydrated(true);
        }
      }
    }
    loadAll();
    return () => {
      active = false;
    };
  }, [dbMode, supabase, user]);

  // --- localStorage senkronu (yalnızca demo modunda) ---
  useEffect(() => {
    if (hydrated && !dbMode)
      window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(tracked));
  }, [tracked, hydrated, dbMode]);

  useEffect(() => {
    if (hydrated && !dbMode)
      window.localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  }, [rules, hydrated, dbMode]);

  const isTracked = useCallback(
    (site: string, title: string) =>
      tracked.some((t) => t.result.site === site && t.result.title === title),
    [tracked],
  );

  const track = useCallback(
    (result: ProductResult) => {
      if (tracked.some((t) => t.result.site === result.site && t.result.title === result.title)) {
        return;
      }
      const optimistic: TrackedProduct = {
        id: uid(),
        result,
        addedAt: new Date().toISOString(),
      };
      setTracked((prev) => [optimistic, ...prev]);

      if (dbMode && supabase && user) {
        (async () => {
          const { data: prod, error } = await supabase
            .from("products")
            .insert({
              user_id: user.id,
              site: result.site,
              title: result.title,
              image_url: result.imageUrl,
              product_url: result.productUrl,
              category: result.category,
              brand: result.brand,
              currency: result.currency,
            })
            .select("id")
            .single();
          if (error || !prod) return;
          await supabase.from("variants").insert(
            result.variants.map((v) => ({
              product_id: prod.id,
              variant_type: v.type,
              variant_label: v.label,
              in_stock: v.inStock,
              stock_count: v.stockCount ?? null,
              price: v.price,
            })),
          );
          setTracked((prev) =>
            prev.map((t) => (t.id === optimistic.id ? { ...t, id: prod.id } : t)),
          );
        })();
      }
    },
    [tracked, dbMode, supabase, user],
  );

  const untrack = useCallback(
    (id: string) => {
      setTracked((prev) => prev.filter((t) => t.id !== id));
      if (dbMode && supabase) {
        supabase.from("products").delete().eq("id", id).then(() => {});
      }
    },
    [dbMode, supabase],
  );

  const addRule = useCallback(
    (rule: Omit<NotificationRule, "id" | "createdAt">) => {
      const optimistic: NotificationRule = {
        ...rule,
        id: uid(),
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [optimistic, ...prev]);

      if (dbMode && supabase && user) {
        (async () => {
          const { data, error } = await supabase
            .from("notifications")
            .insert({
              user_id: user.id,
              product_title: rule.productTitle,
              site: rule.site,
              variant_label: rule.variantLabel ?? null,
              trigger_type: rule.triggerType,
              target_price: rule.targetPrice ?? null,
              channel: rule.channel,
              is_active: rule.isActive,
            })
            .select("id")
            .single();
          if (!error && data) {
            setRules((prev) =>
              prev.map((r) => (r.id === optimistic.id ? { ...r, id: data.id } : r)),
            );
          }
        })();
      }
    },
    [dbMode, supabase, user],
  );

  const toggleRule = useCallback(
    (id: string) => {
      let next = false;
      setRules((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            next = !r.isActive;
            return { ...r, isActive: next };
          }
          return r;
        }),
      );
      if (dbMode && supabase) {
        supabase.from("notifications").update({ is_active: next }).eq("id", id).then(() => {});
      }
    },
    [dbMode, supabase],
  );

  const removeRule = useCallback(
    (id: string) => {
      setRules((prev) => prev.filter((r) => r.id !== id));
      if (dbMode && supabase) {
        supabase.from("notifications").delete().eq("id", id).then(() => {});
      }
    },
    [dbMode, supabase],
  );

  const value = useMemo<StoreState>(
    () => ({
      tracked,
      rules,
      isTracked,
      track,
      untrack,
      addRule,
      toggleRule,
      removeRule,
    }),
    [tracked, rules, isTracked, track, untrack, addRule, toggleRule, removeRule],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// --- DB satır tipleri ---
interface DbVariant {
  variant_type: Variant["type"];
  variant_label: string;
  in_stock: boolean;
  stock_count: number | null;
  price: number | string;
}
interface DbProduct {
  id: string;
  site: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  category: ProductResult["category"];
  brand: string | null;
  currency: string;
  created_at: string;
  variants: DbVariant[] | null;
}
interface DbNotif {
  id: string;
  product_title: string;
  site: string;
  variant_label: string | null;
  trigger_type: NotificationRule["triggerType"];
  target_price: number | null;
  channel: NotificationRule["channel"];
  is_active: boolean;
  created_at: string;
}
