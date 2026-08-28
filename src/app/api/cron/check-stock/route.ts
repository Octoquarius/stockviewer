import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { searchSite } from "@/lib/adapters";
import {
  sendPush,
  sendEmail,
  backInStockEmail,
  priceDropEmail,
  type PushSub,
} from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface NotifRow {
  id: string;
  user_id: string;
  product_title: string;
  site: string;
  variant_label: string | null;
  trigger_type: "back_in_stock" | "price_drop";
  target_price: number | null;
  channel: "push" | "email" | "both";
}

export async function GET(request: Request) {
  // Security: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: true, ran: false, reason: "supabase not configured" });
  }

  const { data: rules, error } = await admin
    .from("notifications")
    .select("id,user_id,product_title,site,variant_label,trigger_type,target_price,channel")
    .eq("is_active", true)
    .returns<NotifRow[]>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let checked = 0;
  let triggered = 0;

  for (const rule of rules ?? []) {
    checked++;
    const current = await searchSite(rule.site, rule.product_title);
    if (!current) continue;

    // Trigger condition + idempotent event key
    let fired = false;
    let eventKey = "";
    let pushBody = "";
    let email: { subject: string; html: string } | null = null;

    if (rule.trigger_type === "back_in_stock") {
      const target = rule.variant_label
        ? current.variants.find((v) => v.label === rule.variant_label)
        : undefined;
      const inStock = target ? target.inStock : current.variants.some((v) => v.inStock);
      if (inStock) {
        fired = true;
        eventKey = `back_in_stock:${rule.variant_label ?? "any"}`;
        pushBody = `${rule.product_title}${rule.variant_label ? ` (${rule.variant_label})` : ""} is back in stock!`;
        email = backInStockEmail(rule.product_title, rule.variant_label ?? undefined);
      }
    } else {
      const min = Math.min(...current.variants.map((v) => v.price));
      if (rule.target_price != null && min <= rule.target_price) {
        fired = true;
        eventKey = `price_drop:${rule.target_price}:${min}`;
        pushBody = `${rule.product_title} price dropped: ${min} TRY`;
        email = priceDropEmail(rule.product_title, min, rule.variant_label ?? undefined);
      }
    }

    if (!fired) continue;

    // Dedup: skip if this exact event was already sent.
    const { error: logErr } = await admin
      .from("notification_log")
      .insert({ notification_id: rule.id, event_key: eventKey });
    if (logErr) continue; // unique violation = already sent

    triggered++;

    // Push
    if (rule.channel === "push" || rule.channel === "both") {
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .eq("user_id", rule.user_id)
        .returns<PushSub[]>();
      for (const s of subs ?? []) {
        await sendPush(s, { title: "StockViewer 🛍️", body: pushBody, url: "/dashboard" });
      }
    }

    // Email
    if ((rule.channel === "email" || rule.channel === "both") && email) {
      const { data: u } = await admin.auth.admin.getUserById(rule.user_id);
      if (u?.user?.email) await sendEmail(u.user.email, email.subject, email.html);
    }
  }

  return NextResponse.json({ ok: true, ran: true, checked, triggered });
}
