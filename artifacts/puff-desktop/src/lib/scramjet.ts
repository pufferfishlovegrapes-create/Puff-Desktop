let initialized = false;

export async function initScramjet() {
  if (initialized) return;
  initialized = true;

  if (!("serviceWorker" in navigator)) return;

  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  await new Promise<void>((resolve, reject) => {
    const existingController = navigator.serviceWorker.controller;
    if (existingController) {
      resolve();
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => resolve())
      .catch(reject);
  });

  await navigator.serviceWorker.ready;

  await new Promise<void>((resolve) => {
    const tryInit = () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        setTimeout(tryInit, 50);
        return;
      }
      controller.postMessage({ $scramjet: { type: "initConfig" } });
      resolve();
    };
    tryInit();
  });

  const bareMuxRes = await fetch("/baremux/index.mjs").catch(() => null);
  if (bareMuxRes) {
    const BareMuxModule = await import("/baremux/index.mjs");
    const connection = new BareMuxModule.BareMuxConnection("/baremux/worker.js");
    const libcurlRes = await fetch("/baremux/libcurl/index.mjs").catch(
      () => null,
    );
    if (libcurlRes) {
      await connection.setTransport("/baremux/libcurl/index.mjs", [
        { wisp: wispUrl },
      ]);
    } else {
      await connection.setTransport("/baremux/index.mjs", [{ wisp: wispUrl }]);
    }
  }

  const allScript = document.createElement("script");
  allScript.src = "/scram/scramjet.all.js";
  allScript.onload = () => {
    if (typeof $scramjetLoadController === "function") {
      const { ScramjetController } = $scramjetLoadController();
      const scramjet = new ScramjetController({
        files: {
          wasm: "/scram/scramjet.wasm.wasm",
          all: "/scram/scramjet.all.js",
          sync: "/scram/scramjet.sync.js",
        },
      });
      scramjet.init();
    }
  };
  document.head.appendChild(allScript);
}

export function encodeUrl(url) {
  return "/service/" + encodeURIComponent(url);
}
