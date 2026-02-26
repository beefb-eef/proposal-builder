const puppeteer = require("puppeteer");
const fs = require("fs");

function pickExecutablePath() {
  // If you ever decide to use a system Chrome later, you can set one of these env vars.
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.GOOGLE_CHROME_BIN;

  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  // Puppeteer-managed Chrome path (works when postinstall downloaded Chrome)
  const pptrPath = puppeteer.executablePath();
  if (pptrPath && fs.existsSync(pptrPath)) return pptrPath;

  return null;
}

async function htmlToPdfBuffer(html) {
  const executablePath = pickExecutablePath();

  if (!executablePath) {
    throw new Error(
      "Chrome executable not found. Ensure postinstall ran: `npx puppeteer browsers install chrome` and that PUPPETEER_CACHE_DIR is set on Render."
    );
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };