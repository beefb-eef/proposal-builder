const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

/**
 * Convert HTML to PDF (Buffer).
 * Render notes:
 * - We install Chrome into PUPPETEER_CACHE_DIR inside the project directory during build (postinstall).
 * - At runtime, we launch with --no-sandbox flags (required on many container hosts).
 */
async function htmlToPdfBuffer(html) {
  const cacheDir =
    process.env.PUPPETEER_CACHE_DIR ||
    path.join(process.cwd(), ".cache", "puppeteer");

  // Ensure Puppeteer uses the same cache dir at runtime as it did at build time.
  process.env.PUPPETEER_CACHE_DIR = cacheDir;

  const executablePath = puppeteer.executablePath();

  if (!executablePath || !fs.existsSync(executablePath)) {
    const msg =
      `Chrome executable not found.\n` +
      `Expected executablePath=${executablePath}\n` +
      `Checked cacheDir=${cacheDir}\n\n` +
      `Fix:\n` +
      `1) In Render env vars set PUPPETEER_CACHE_DIR=/opt/render/project/src/.cache/puppeteer\n` +
      `2) Ensure build ran the postinstall step (clear build cache + redeploy).\n`;
    throw new Error(msg);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none"
    ]
  });

  try {
    const page = await browser.newPage();

    // If your templates pull remote assets (fonts/images), this helps.
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };