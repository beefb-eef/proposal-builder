// src/services/pdf.js
const puppeteer = require("puppeteer");

async function htmlToPdfBuffer(html, pdfOptions = {}) {
  if (typeof html !== "string" || !html.trim()) {
    throw new Error("htmlToPdfBuffer expected a non-empty HTML string");
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    // Render can be slow; give it time
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

    await page.setContent(html, { waitUntil: ["domcontentloaded", "load"] });

    // Small buffer for fonts/images to settle (no waitForTimeout in your version)
    await new Promise((r) => setTimeout(r, 750));

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
      ...pdfOptions,
    });

    // IMPORTANT: return raw Buffer only
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };