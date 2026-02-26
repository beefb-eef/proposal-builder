// src/services/pdf.js
const puppeteer = require("puppeteer");

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
  "--single-process",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function htmlToPdfBuffer(html) {
  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: LAUNCH_ARGS,
    });

    page = await browser.newPage();

    // Give Render some breathing room
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

    // Prevent slow/blocked third-party calls from hanging the render
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();

      // Allow data URIs (inline images/fonts)
      if (url.startsWith("data:")) return req.continue();

      // Allow calls to your own Render service URL if referenced
      if (process.env.RENDER_EXTERNAL_URL && url.startsWith(process.env.RENDER_EXTERNAL_URL)) {
        return req.continue();
      }

      // Block common hang-makers
      if (
        url.includes("google-analytics") ||
        url.includes("googletagmanager") ||
        url.includes("segment.com") ||
        url.includes("mixpanel") ||
        url.includes("hotjar") ||
        url.includes("doubleclick") ||
        url.includes("facebook") ||
        url.includes("intercom") ||
        url.endsWith(".mp4") ||
        url.endsWith(".webm")
      ) {
        return req.abort();
      }

      return req.continue();
    });

    // Key change: don't wait for every network request forever
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    // Fonts/layout settle time (safe in Puppeteer v24)
    try {
      await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
    } catch {}
    await sleep(750);

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 120000,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });

    return pdfBuffer;
  } finally {
    try {
      if (page) await page.close();
    } catch {}
    try {
      if (browser) await browser.close();
    } catch {}
  }
}

module.exports = { htmlToPdfBuffer };