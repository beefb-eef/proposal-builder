const { clampNumber, toNumber, currency, number, percent } = require("./format");

function buildProposalModel(payload) {
  const vertical = (payload.vertical || "waterpark").toLowerCase();
  const verticalLabel =
    vertical === "zoo" ? "Zoo" : vertical === "farm" ? "Farm" : "Waterpark";

  const clientName = String(payload.clientName || "").trim() || "Customer";

  const product = (payload.product || "both").toLowerCase(); // maps | ai | both
  const bundleChoice = (payload.bundleChoice || "ai_plus_maps").toLowerCase(); // ai_only | ai_plus_maps

  // MAPS
  const mapBasePrice = toNumber(payload.mapBasePrice, 10000);
  const setupFee = toNumber(payload.setupFee, 3000); // keep as a configurable constant; default matches your sample
  const maps = Array.isArray(payload.maps) ? payload.maps : [];

  const cleanedMaps = maps
    .map((m, idx) => ({
      name: String(m?.name || "").trim() || `Map ${idx + 1}`
    }))
    .slice(0, 25);

  const mapsCount = cleanedMaps.length;
  const mapsSubtotal = mapsCount * mapBasePrice;

  // AI INPUTS
  const attendance = clampNumber(payload.attendance ?? 700000, 0, 999999999);
  const inquiryRatio = clampNumber(payload.inquiryRatio ?? 0.30, 0, 1);
  const avgConvosPerGuest = clampNumber(payload.avgConvosPerGuest ?? 5, 0, 100);
  const costPerConversation = clampNumber(payload.costPerConversation ?? 0.005, 0, 100);
  const marginProfitRatio = clampNumber(payload.marginProfitRatio ?? 0.50, 0.01, 1);

  // AI CALCS (as specified)
  const aiUsage = attendance * inquiryRatio;
  const expectedConversations = aiUsage * avgConvosPerGuest;
  const expectedCost = expectedConversations * costPerConversation;
  const grossProfit = expectedCost / marginProfitRatio;

  // Quoted AI price defaults to grossProfit but can be overridden
  const aiQuotedPrice = toNumber(payload.aiQuotedPrice, grossProfit);

  // TOTALS & PACKAGE DISPLAY LOGIC
  const includeMaps = product === "maps" || product === "both";
  const includeAI = product === "ai" || product === "both";

  const showMapsOnlyCard = includeMaps;
  const showAiOnlyCard = includeAI;
  const showBundleCards = product === "both";

  const mapsOnlyTotal = mapsSubtotal + (includeMaps ? setupFee : 0);
  const aiOnlyTotal = aiQuotedPrice;
  const bundleTotal = (includeMaps ? mapsSubtotal + setupFee : 0) + aiQuotedPrice;

  // “Recommended” selection when both
  const recommendedCard =
    product === "both"
      ? (bundleChoice === "ai_only" ? "ai_only" : "ai_plus_maps")
      : (product === "maps" ? "maps_only" : "ai_only");

  // Theme colors (matches your waterpark orange vibe; tweak per vertical if you want)
  const theme = {
    accent: vertical === "zoo" ? "#16a34a" : vertical === "farm" ? "#7c3aed" : "#FF6B35",
    accentSoft: vertical === "zoo" ? "#ecfdf5" : vertical === "farm" ? "#f5f3ff" : "#FFF5F0"
  };

  // Dates / validity (kept simple)
  const validityDays = 30;
  const preparedDate = payload.preparedDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return {
    vertical,
    verticalLabel,
    clientName,
    product,
    bundleChoice,
    recommendedCard,
    theme,

    // maps
    maps: cleanedMaps,
    mapBasePrice,
    setupFee,
    mapsCount,
    mapsSubtotal,
    mapsOnlyTotal,

    // ai
    attendance,
    inquiryRatio,
    avgConvosPerGuest,
    costPerConversation,
    marginProfitRatio,
    aiUsage,
    expectedConversations,
    expectedCost,
    grossProfit,
    aiQuotedPrice,
    aiOnlyTotal,

    // bundle
    bundleTotal,

    // card visibility
    showMapsOnlyCard,
    showAiOnlyCard,
    showBundleCards,

    preparedDate,
    validityDays,

    // formatted helpers for template (so template stays dumb)
    fmt: {
      mapBasePrice: currency(mapBasePrice),
      setupFee: currency(setupFee),
      mapsSubtotal: currency(mapsSubtotal),
      mapsOnlyTotal: currency(mapsOnlyTotal),

      attendance: number(attendance),
      inquiryRatio: percent(inquiryRatio, { decimals: 0 }),
      avgConvosPerGuest: number(avgConvosPerGuest, { decimals: 0 }),
      costPerConversation: currency(costPerConversation, { decimals: 3 }),
      marginProfitRatio: percent(marginProfitRatio, { decimals: 0 }),

      aiUsage: number(aiUsage, { decimals: 0 }),
      expectedConversations: number(expectedConversations, { decimals: 0 }),
      expectedCost: currency(expectedCost, { decimals: 0 }),
      grossProfit: currency(grossProfit, { decimals: 0 }),
      aiQuotedPrice: currency(aiQuotedPrice, { decimals: 0 }),
      aiOnlyTotal: currency(aiOnlyTotal, { decimals: 0 }),

      bundleTotal: currency(bundleTotal, { decimals: 0 })
    }
  };
}

module.exports = { buildProposalModel };
