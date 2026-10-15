import icons, { removedAppNames } from "./apps";

const removedApps = new Set(removedAppNames);
const getSavedAppList = (key, fallback) => {
  const saved = localStorage.getItem(key);
  const previousApps = saved ? JSON.parse(saved) : fallback;
  const apps = previousApps
    .map((name) => (name === "Ali" ? "Puff" : name))
    .filter((name) => !removedApps.has(String(name).toLowerCase()));
  if (saved && JSON.stringify(apps) !== JSON.stringify(previousApps)) {
    localStorage.setItem(key, JSON.stringify(apps));
  }
  return apps;
};

var { taskbar, desktop, pinned, recent } = {
  taskbar: getSavedAppList("taskbar", [
    "Settings",
    "File Explorer",
    "Browser",
    "Store",
    "Spotify",
  ]),
  desktop: getSavedAppList("desktop", [
    "Puff",
    "Recycle Bin",
    "File Explorer",
    "Browser",
    "Mail",
    "Notepad",
    "Store",
  ]),
  pinned: getSavedAppList("pinned", [
    "Browser",
    "Get Started",
    "Task Manager",
    "Mail",
    "Settings",
    "Store",
    "Notepad",
    "Whiteboard",
    "Calculator",
    "Spotify",
    "File Explorer",
    "Terminal",
    "Discord",
    "Camera",
  ]),
  recent: getSavedAppList("recent", [
    "Mail",
    "Terminal",
    "File Explorer",
    "Notepad",
  ]),
};

export const taskApps = icons.filter((x) => taskbar.includes(x.name));

export const desktopApps = icons
  .filter((x) => desktop.includes(x.name))
  .sort((a, b) => {
    return desktop.indexOf(a.name) > desktop.indexOf(b.name) ? 1 : -1;
  });

export const pinnedApps = icons
  .filter((x) => pinned.includes(x.name))
  .sort((a, b) => {
    return pinned.indexOf(a.name) > pinned.indexOf(b.name) ? 1 : -1;
  });

export const recentApps = icons
  .filter((x) => recent.includes(x.name))
  .sort((a, b) => {
    return recent.indexOf(a.name) > recent.indexOf(b.name) ? 1 : -1;
  });

export const allApps = icons.filter((app) => {
  return app.type === "app";
});

export const dfApps = {
  taskbar,
  desktop,
  pinned,
  recent,
};
