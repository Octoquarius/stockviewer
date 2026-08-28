// Browser push subscription helpers.
// The VAPID public key comes from NEXT_PUBLIC_VAPID_PUBLIC_KEY; if it's missing,
// only Notification permission is requested (the subscription isn't sent to the backend).

export type PushState = "unsupported" | "default" | "granted" | "denied";

export function getPushState(): PushState {
  if (typeof window === "undefined") return "default";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission as PushState;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function subscribeToPush(): Promise<PushState> {
  if (getPushState() === "unsupported") return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission as PushState;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (vapid) {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } else {
      // If VAPID isn't configured, show a local notification for demo purposes.
      reg.showNotification("StockViewer notifications are on 🎉", {
        body: "We'll let you know here when stock arrives or the price drops.",
        icon: "/icon.svg",
      });
    }
  } catch (err) {
    console.error("Push subscribe failed", err);
  }

  return "granted";
}
