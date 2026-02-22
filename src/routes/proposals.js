const express = require("express");
const { buildProposalModel } = require("../services/calc");
const { renderProposalHtml } = require("../services/renderTemplate");
const { htmlToPdfBuffer } = require("../services/pdf");

const router = express.Router();

/**
 * POST /api/preview
 * Body: builder payload
 * Returns: { html }
 */
router.post("/preview", async (req, res) => {
  try {
    const payload = req.body || {};
    const model = buildProposalModel(payload);
    const html = await renderProposalHtml(model);
    res.json({ html });
  } catch (err) {
    console.error("PREVIEW failed:", err?.stack || err);
    res.status(400).json({
      error: "Could not render preview.",
      details: err?.message || String(err)
    });
  }
});

/**
 * POST /api/pdf
 * Body: builder payload
 * Returns: application/pdf
 */
router.post("/pdf", async (req, res) => {
  try {
    const payload = req.body || {};
    const model = buildProposalModel(payload);
    const html = await renderProposalHtml(model);

    const pdfBuffer = await htmlToPdfBuffer(html);

    const safeName =
      (model.clientName || "proposal")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "proposal";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("PDF failed:", err?.stack || err);
    // PDF failures are server failures, not "bad request"
    res.status(500).json({
      error: "Could not generate PDF.",
      details: err?.message || String(err)
    });
  }
});

module.exports = router;