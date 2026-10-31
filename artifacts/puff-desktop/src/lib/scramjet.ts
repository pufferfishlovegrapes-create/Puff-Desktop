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
      reject(new Error("The proxy service worker did not take control. Reload Puff Desktop and try again."));
    }, 15000);

    const onChange = () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(controller);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    onChange();
  });
}

async function initializeScramjet(): Promise<void> {
  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  const controller = await waitForServiceWorkerController();
  controller.postMessage({ $scramjet: { type: "initConfig" } });

  const bareMuxResponse = await fetch("/baremux/index.mjs", {
    cache: "no-store",
  });
  if (!bareMuxResponse.ok) {
    throw new Error("Bare-Mux assets are missing. Check the Puff Desktop build output.");
  }

  const BareMuxModule = await import("/baremux/index.mjs");
  const connection = new BareMuxModule.BareMuxConnection("/baremux/worker.js");

  const libcurlResponse = await fetch("/baremux/libcurl/index.mjs", {
    cache: "no-store",
  }).catch(() => null);

  if (libcurlResponse?.ok) {
    await connection.setTransport("/baremux/libcurl/index.mjs", [
      { wisp: wispUrl },
    ]);
  } else {
    await connection.setTransport("/baremux/index.mjs", [{ wisp: wispUrl }]);
  }

  // Wait for the controller bundle to load and initialize before Edge
  // creates its first proxied iframe.
  if (typeof $scramjetLoadController !== "function") {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/scram/scramjet.all.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Scramjet assets."));
      document.head.appendChild(script);
    });
  }

  if (typeof $scramjetLoadController !== "function") {
    throw new Error("Scramjet controller bundle loaded, but its loader was not found.");
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
      // Allow a later retry if initialization fails.
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export function encodeUrl(url: string): string {
  return "/service/" + encodeURIComponent(url);
}
