const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { install, computeExecutablePath } = require("@puppeteer/browsers");

function getCacheDir() {
  // /tmp is always writable on Render Linux containers
  if (process.env.RENDER) return "/tmp/puppeteer";
  return path.join(process.cwd(), ".cache", "puppeteer");
}

async function ensureChromeExecutable() {
  const cacheDir = process.env.PUPPETEER_CACHE_DIR || getCacheDir();
  process.env.PUPPETEER_CACHE_DIR = cacheDir;

  fs.mkdirSync(cacheDir, { recursive: true });

  const buildId = await puppeteer.browserVersion(); // e.g. "145.0.7632.77"

  const getExePath = () =>
    computeExecutablePath({
      cacheDir,
      browser: "chrome",
      buildId
    });

  let executablePath = getExePath();

  // If missing, download Chrome-for-Testing into cacheDir
  if (!fs.existsSync(executablePath)) {
    console.log(`[pdf] Chrome missing. Installing buildId=${buildId} into ${cacheDir}...`);

    await install({
      cacheDir,
      browser: "chrome",
      buildId,
      // Force Linux download on Render
      platform: "linux"
    });

    executablePath = getExePath();

    if (!fs.existsSync(executablePath)) {
      // If we still can’t find it, fail with a very explicit error
      const listing = fs.existsSync(cacheDir)
        ? fs.readdirSync(cacheDir, { withFileTypes: true }).map(d => d.name).join(", ")
        : "(cacheDir does not exist)";

      throw new Error(
        `[pdf] Chrome install did not produce an executable.\n` +
          `Expected: ${executablePath}\n` +
          `CacheDir: ${cacheDir}\n` +
          `CacheDir contents: ${listing}`
      );
    }

    console.log(`[pdf] Chrome installed OK at: ${executablePath}`);
  }

  return executablePath;
}

async function htmlToPdfBuffer(html) {
  const executablePath = await ensureChromeExecutable();

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("screen");

    return await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" }
    });
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };