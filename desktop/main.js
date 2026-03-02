// desktop/main.js

// ✅ Prevent infinite launch loops during install/update on Windows
if (require("electron-squirrel-startup")) {
  process.exit(0);
}

const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const http = require("http");
const fs = require("fs");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

let backendProcess = null;
let backendStarted = false;

function waitForHealth(url, timeoutMs = 20000, intervalMs = 400) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on("error", retry);

      function retry() {
        if (Date.now() - start > timeoutMs) return reject(new Error("Health timeout"));
        setTimeout(tick, intervalMs);
      }
    };
    tick();
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1200,
    height: 760,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff", // 👈 add here
    icon: path.join(__dirname, "assets", "icon.ico"),
  });

  win.loadURL(`http://127.0.0.1:${port}`);

  win.once("ready-to-show", () => {
    win.maximize();   // ✅ makes it open full screen (maximized)
    win.show();
  });
}

function startBackend() {
  const port = process.env.PORT || "4000";

  // ✅ prevent starting backend more than once
  if (backendStarted) return { port };
  backendStarted = true;

  // DB lives in AppData\Roaming\<AppName>\database\app.db (writable + not hardcoded)
  const userData = app.getPath("userData"); // e.g. C:\Users\<user>\AppData\Roaming\Reservation System
  const dbDir = path.join(userData, "database");
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "app.db");
  
  // In packaged app, backend might be in resources\app.asar.unpacked\backend OR resources\backend
  // In dev, backend is in ../backend
  const isPackaged = app.isPackaged;

  let backendDir;
  if (isPackaged) {
    backendDir = path.join(process.resourcesPath, "backend");
  } else {
    backendDir = path.join(__dirname, "..", "backend");
  }

  const serverJs = path.join(backendDir, "server.js");
  const schemaPath = path.join(backendDir, "src", "schema.sql");

  // Frontend dist path
  const frontendDist = isPackaged
    ? path.join(process.resourcesPath, "frontend_dist")
    : path.join(__dirname, "..", "frontend", "dist");

const logFile = path.join(app.getPath("userData"), "backend.log");
fs.appendFileSync(logFile, `\n[Electron] startBackend() called at ${new Date().toISOString()}\n`);
fs.appendFileSync(logFile, `[Electron] isPackaged=${app.isPackaged}\n`);
fs.appendFileSync(logFile, `[Electron] backendDir=${backendDir}\n`);
fs.appendFileSync(logFile, `[Electron] serverJs=${serverJs}\n`);
fs.appendFileSync(logFile, `[Electron] frontendDist=${frontendDist}\n`);
fs.appendFileSync(logFile, `[Electron] dbPath=${dbPath}\n`);

const out = fs.openSync(logFile, "a");
const err = fs.openSync(logFile, "a");

// ✅ fork runs server.js using Electron's embedded Node correctly
backendProcess = fork(serverJs, [], {
  cwd: backendDir,
  env: {
    ...process.env,
    PORT: String(port),
    DB_PATH: dbPath,
    FRONTEND_DIST: frontendDist,
    SCHEMA_PATH: schemaPath,
  },
  stdio: ["ignore", out, err, "ipc"],
  windowsHide: true,
});

backendProcess.on("error", (e) => {
  try {
    fs.appendFileSync(logFile, `\n[Electron] spawn error: ${e.message}\n`);
  } catch {}
});

  backendProcess.on("exit", (code) => {
    try {
      fs.appendFileSync(logFile, `\n[Electron] Backend exited with code: ${code}\n`);
    } catch {}
  });

  return { port };
}

app.whenReady().then(async () => {
  const { port } = startBackend();

  try {
    await waitForHealth(`http://127.0.0.1:${port}/api/health`, 25000);
  } catch (e) {
    // even if health fails, still open (useful for debugging)
    console.error(e);
  }

  createWindow(port);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on("window-all-closed", () => {
  // Quit app when window closed (typical on Windows)
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});