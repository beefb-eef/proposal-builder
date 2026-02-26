// src/services/pdf.js
const puppeteer = require("puppeteer");

// Render/Linux needs these flags to run Chromium safely in a container
const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
  "--single-process",
];

async function htmlToPdfBuffer(html) {
  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: LAUNCH_ARGS,
      // If you set a custom executablePath elsewhere, remove it.
      // Let puppeteer use the bundled Chromium it installs.
    });

    page = await browser.newPage();

    // Give Render some breathing room
    page.setDefaultNavigationTimeout(120000); // 2 min
    page.setDefaultTimeout(120000);

    // Optional but VERY helpful: prevent slow/blocked 3rd party calls from hanging the render.
    // Keep local assets + data URIs + same-document resources.
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();

      // Allow data URIs (inline images/fonts)
      if (url.startsWith("data:")) return req.continue();

      // Allow your own site if you reference it (Render service URL)
      // If your HTML references https://proposal-builder-7li4.onrender.com/..., allow it:
      // (If you don't need this, you can delete this block.)
      if (process.env.RENDER_EXTERNAL_URL && url.startsWith(process.env.RENDER_EXTERNAL_URL)) {
        return req.continue();
      }

      // Block common hang-makers (analytics, trackers, huge videos, etc.)
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

      // Otherwise allow
      return req.continue();
    });

    // Load HTML. The key change:
    // - use waitUntil: "domcontentloaded" so we don't wait on every network request to finish
    // - then wait a short, fixed time for fonts/layout to settle
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    // Wait for fonts to be ready (prevents ugly fallback fonts in the PDF)
    // If fonts never load, we still continue after the timeout.
    await page.evaluateHandle("document.fonts && document.fonts.ready");
    await page.waitForTimeout(750);

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 120000,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });

    return pdfBuffer;
  } finally {
    // Always close to avoid memory leaks on Render
    try {
      if (page) await page.close();
    } catch {}
    try {
      if (browser) await browser.close();
    } catch {}
  }
}

module.exports = { htmlToPdfBuffer };