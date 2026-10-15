import icons from "./apps";

const getSavedAppList = (key, fallback) => {
  const saved = localStorage.getItem(key);
  const apps = saved ? JSON.parse(saved) : fallback;
  return apps.map((name) => (name === "Ali" ? "Puff" : name));
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
    "WhatsApp",
    "LinkedIn",
    "Github",
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
    "LinkedIn",
    "File Explorer",
    "Terminal",
    "Github",
    "Discord",
    "Camera",
    "WhatsApp",
  ]),
  recent: getSavedAppList("recent", [
    "Mail",
    "LinkedIn",
    "Terminal",
    "Github",
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
