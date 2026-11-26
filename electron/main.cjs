const { app, BrowserWindow } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json"
};

function startLocalServer() {
  const root = path.join(app.getAppPath(), "dist");
  const server = http.createServer((req, res) => {
    let pathname = "/";
    try { pathname = decodeURIComponent(new URL(req.url || "/", "http://127.0.0.1").pathname); }
    catch { res.writeHead(400); res.end("Bad request"); return; }

    let target = path.resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      if ((req.headers.accept || "").includes("text/html")) target = path.join(root, "index.html");
      else { res.writeHead(404); res.end("Not found"); return; }
    }
    const type = mime[path.extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    fs.createReadStream(target).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Could not start local app server"));
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

let localServer;
async function createWindow() {
  const local = await startLocalServer();
  localServer = local.server;
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#090a09",
    title: "COLONY GESTION",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.once("ready-to-show", () => win.show());
  await win.loadURL(local.url);
}

app.whenReady().then(createWindow).catch(error => {
  console.error("COLONY GESTION desktop startup failed:", error);
  app.quit();
});
app.on("window-all-closed", () => {
  if (localServer) localServer.close();
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(() => app.quit());
});
