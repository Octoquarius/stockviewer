import "server-only";
import webpush from "web-push";
import { Resend } from "resend";

// Push + e-posta gönderimi. Anahtar yoksa sessizce atlar (demo modu).

let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  vapidReady = true;
  return true;
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(
  sub: PushSub,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  if (!ensureVapid()) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({ ...payload, icon: "/icon.svg" }),
    );
    return true;
  } catch (err) {
    console.error("sendPush failed", err);
    return false;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "StockViewer <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("sendEmail failed", err);
    return false;
  }
}

export function backInStockEmail(product: string, variant?: string): { subject: string; html: string } {
  const what = variant ? `${product} (${variant})` : product;
  return {
    subject: `🎉 ${what} tekrar stokta!`,
    html: `<div style="font-family:sans-serif">
      <h2>🎉 Aradığın ürün stokta!</h2>
      <p><b>${what}</b> tekrar stoğa girdi. Tükenmeden incele.</p>
      <p style="color:#888">StockViewer</p>
    </div>`,
  };
}

export function priceDropEmail(product: string, price: number, variant?: string): { subject: string; html: string } {
  const what = variant ? `${product} (${variant})` : product;
  return {
    subject: `💸 ${what} fiyatı düştü!`,
    html: `<div style="font-family:sans-serif">
      <h2>💸 Fiyat düştü!</h2>
      <p><b>${what}</b> artık <b>${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(price)}</b>.</p>
      <p style="color:#888">StockViewer</p>
    </div>`,
  };
}
