const puppeteer = require("puppeteer");

async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
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

    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("screen");

    return await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in"
      }
    });
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };