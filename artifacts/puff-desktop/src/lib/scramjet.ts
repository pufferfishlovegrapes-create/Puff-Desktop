let initialization: Promise<void> | null = null;

async function waitForServiceWorkerController(): Promise<ServiceWorker> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await navigator.serviceWorker.ready;

  if (navigator.serviceWorker.controller) {
    return navigator.serviceWorker.controller;
  }

  return new Promise<ServiceWorker>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      reject(
        new Error(
          "The proxy service worker did not take control. Reload Puff Desktop and try again.",
        ),
      );
    }, 15000);

    const onChange = () => {
      const activeController = navigator.serviceWorker.controller;
      if (!activeController) return;
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(activeController);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    onChange();
  });
}

async function loadScript(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const existing = Array.from(document.scripts).find(
      (script) => script.src === new URL(src, location.href).href,
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Could not load ${src}`)),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

async function initializeScramjet(): Promise<void> {
  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  const serviceWorker = await waitForServiceWorkerController();

  // Initialize the Scramjet service-worker configuration before any proxied
  // iframe or subresource can be requested.
  serviceWorker.postMessage({ $scramjet: { type: "initConfig" } });

  const requiredAssets = [
    "/scram/scramjet.all.js",
    "/scram/scramjet.wasm.wasm",
    "/baremux/index.mjs",
    "/baremux/worker.js",
    "/libcurl/index.mjs",
  ];

  const checks = await Promise.all(
    requiredAssets.map(async (asset) => {
      const response = await fetch(asset, { method: "HEAD", cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Required proxy asset is unavailable (${response.status}): ${asset}`);
      }
    }),
  );
  void checks;

  const BareMuxModule = await import("/baremux/index.mjs");
  const connection = new BareMuxModule.BareMuxConnection("/baremux/worker.js");

  // Scramjet 1.1 uses the Bare-Mux transport interface. Libcurl is a
  // separate package and must be served from /libcurl/, not /baremux/.
  await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);

  await loadScript("/scram/scramjet.all.js");

  if (typeof $scramjetLoadController !== "function") {
    throw new Error("Scramjet controller loader was not found in the runtime bundle.");
  }

  const { ScramjetController } = $scramjetLoadController();
  const scramjet = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js",
    },
  });

  await Promise.resolve(scramjet.init());

}

export function initScramjet(): Promise<void> {
  if (!initialization) {
    initialization = initializeScramjet().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export function encodeUrl(url: string): string {
  return "/service/" + encodeURIComponent(url);
}
