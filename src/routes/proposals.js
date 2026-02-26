// src/routes/proposals.js
const express = require("express");
const router = express.Router();

const { htmlToPdfBuffer } = require("../services/pdf");
// ⚠️ Update this import/path to whatever you use to render your HTML:
const { renderProposalHtml } = require("../templates/renderProposalHtml"); // example

router.post("/pdf", async (req, res) => {
  try {
    // 1) Build HTML string (must be a string)
    const html = renderProposalHtml(req.body);

    // 2) Generate PDF Buffer
    const buf = await htmlToPdfBuffer(html);

    // 3) Validate signature (quick sanity check)
    if (!buf.slice(0, 5).equals(Buffer.from("%PDF-"))) {
      console.error("[pdf] Not a PDF. First bytes:", buf.slice(0, 20).toString("utf8"));
      return res.status(500).json({ error: "Generated output is not a PDF" });
    }

    // 4) Send as binary (NOT json)
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="customer.pdf"');
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Cache-Control", "no-store");

    return res.end(buf);
  } catch (err) {
    console.error("PDF route error:", err);
    return res.status(500).json({ error: "PDF generation failed", message: err.message });
  }
});

module.exports = router;