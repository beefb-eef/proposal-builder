const puppeteer = require("puppeteer");

async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    // Render-friendly Chromium flags
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process"
    ]
  });

  try {
    const page = await browser.newPage();

    // Avoid "networkidle0" on Render (it can hang).
    // "load" is much more stable for HTML we provide directly.
    await page.setContent(html, { waitUntil: "load" });

    // Ensure backgrounds/gradients match your HTML
    await page.emulateMediaType("screen");

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