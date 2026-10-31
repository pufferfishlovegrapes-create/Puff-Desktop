importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Activate updates promptly and let this worker control the first page load.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // respondWith must receive a Promise<Response>, not an async function.
  event.respondWith(
    (async () => {
      try {
        await scramjet.loadConfig();

        if (scramjet.route(event)) {
          return await scramjet.fetch(event);
        }

        // Requests for Puff Desktop itself (API, assets, etc.) stay on
        // the app origin. Proxied website requests are handled above.
        return fetch(event.request);
      } catch (error) {
        console.error("[Puff Desktop] Scramjet request failed:", error);

        // Do not retry a failed proxied navigation directly: that would
        // bypass the proxy and expose the user's normal network request.
        return new Response(
          "The proxy could not load this page. Please check the Wisp connection and try again.",
          {
            status: 502,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
