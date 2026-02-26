const path = require("path");
const puppeteer = require("puppeteer");

function getCacheDir() {
  // Render expects this location (matches your error message)
  if (process.env.RENDER) return "/opt/render/.cache/puppeteer";
  // Local dev cache inside your project folder
  return path.join(process.cwd(), ".cache", "puppeteer");
}

async function htmlToPdfBuffer(html) {
  // Ensure Puppeteer looks in the same cache dir we install into
  process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || getCacheDir();

  const browser = await puppeteer.launch({
    headless: "new",
    // This makes puppeteer use its downloaded Chrome (when present)
    executablePath: puppeteer.executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in"
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };