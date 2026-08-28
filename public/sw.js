// StockViewer service worker — displays push notifications.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "StockViewer", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "StockViewer";
  const options = {
    body: data.body || "Stock or price was updated.",
    icon: data.icon || "/icon.svg",
    badge: "/icon.svg",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
