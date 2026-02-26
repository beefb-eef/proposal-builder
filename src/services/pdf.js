const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

function getCacheDir() {
  // Render-friendly default
  return (
    process.env.PUPPETEER_CACHE_DIR ||
    (process.env.RENDER
      ? "/opt/render/.cache/puppeteer"
      : path.join(process.cwd(), ".cache", "puppeteer"))
  );
}

async function resolveChromeExecutable() {
  // 1) Prefer explicit env override if you ever set it
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2) Puppeteer’s own resolver (works when its managed Chrome is installed)
  // In puppeteer v24+, executablePath() returns the installed browser path (if present)
  const pptrPath = puppeteer.executablePath?.();
  if (pptrPath && fs.existsSync(pptrPath)) {
    return pptrPath;
  }

  // 3) Last-resort: search common locations inside the Puppeteer cache dir
  const cacheDir = getCacheDir();
  const candidates = [
    path.join(cacheDir, "chrome", "linux-*/chrome-linux64/chrome"),
    path.join(cacheDir, "chrome", "mac_*/chrome-mac-*/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
    path.join(cacheDir, "chrome", "win64-*/chrome-win64/chrome.exe")
  ];

  // Simple glob-ish matcher without extra deps:
  for (const pattern of candidates) {
    const base = pattern.split("*")[0];
    const rest = pattern.split("*").slice(1).join("*");
    if (!fs.existsSync(base)) continue;

    // walk one level to match the wildcard segment(s)
    const parts = pattern.split("*");
    let roots = [parts[0]];

    for (let i = 1; i < parts.length; i++) {
      const suffix = parts[i];
      const nextRoots = [];
      for (const r of roots) {
        const dir = path.dirname(r);
        const prefix = path.basename(r);
        if (!fs.existsSync(dir)) continue;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isDirectory()) continue;
          if (prefix && !e.name.startsWith(prefix)) continue;
          const candidateRoot = path.join(dir, e.name) + suffix;
          nextRoots.push(candidateRoot);
        }
      }
      roots = nextRoots;
    }

    for (const maybe of roots) {
      if (maybe && fs.existsSync(maybe)) return maybe;
    }
  }

  // If we got here, Chrome isn't where it should be.
  throw new Error(
    `Chrome executable not found. Ensure build ran: "npx puppeteer browsers install chrome" and that PUPPETEER_CACHE_DIR is set. Checked cacheDir=${getCacheDir()}`
  );
}

async function htmlToPdfBuffer(html, options = {}) {
  const executablePath = await resolveChromeExecutable();

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
      ...options
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };