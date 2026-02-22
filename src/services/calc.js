const { clampNumber, toNumber, currency, number, percent } = require("./format");

const MAP_PLANS = {
  basic: {
    name: "Basic",
    price: 10000,
    features: [
      "Interactive web map",
      "Wait time manager",
      "Location CMS"
    ]
  },
  standard: {
    name: "Standard",
    price: 15000,
    features: [
      "Interactive web map",
      "Wait time manager",
      "Location CMS",
      "Guest Dashboard",
      "Guest Journey",
      "Real time feedback"
    ]
  },
  premium: {
    name: "Premium",
    price: 30000, // default since price wasn’t specified; editable in UI
    features: [
      "Interactive web map",
      "Wait time manager",
      "Location CMS",
      "Guest Dashboard",
      "Guest Journey",
      "Real time feedback",
      "Personalized offerings",
      "Automated marketing",
      "System integrations"
    ]
  }
};

function buildProposalModel(payload) {
  const vertical = String(payload.vertical || "waterpark").toLowerCase();
  const verticalLabel =
    vertical === "zoo" ? "Zoo" :
    vertical === "farm" ? "Farm" :
    vertical === "waterpark" ? "Waterpark" :
    "Venue";

  const clientName = String(payload.clientName || "").trim() || "Customer";

  // maps | ai | both
  const product = String(payload.product || "both").toLowerCase();

  // bundle choice (kept)
  const bundleChoice = String(payload.bundleChoice || "ai_plus_maps").toLowerCase();

  // MAPS (plan-based)
  const mapPlanKey = String(payload.mapPlan || "basic").toLowerCase();
  const mapPlan = MAP_PLANS[mapPlanKey] || MAP_PLANS.basic;

  // Allow override price (optional)
  const mapUnitPrice = toNumber(payload.mapUnitPrice, mapPlan.price);

  const setupFee = toNumber(payload.setupFee, 3000);

  const maps = Array.isArray(payload.maps) ? payload.maps : [];
  const cleanedMaps = maps
    .map((m, idx) => ({
      name: String(m?.name || "").trim() || `Map ${idx + 1}`
    }))
    .slice(0, 25);

  const mapsCount = cleanedMaps.length;
  const mapsSubtotal = mapsCount * mapUnitPrice;

  // AI inputs
  const attendance = clampNumber(payload.attendance ?? 700000, 0, 999999999);
  const inquiryRatio = clampNumber(payload.inquiryRatio ?? 0.30, 0, 1);
  const avgConvosPerGuest = clampNumber(payload.avgConvosPerGuest ?? 5, 0, 100);
  const costPerConversation = clampNumber(payload.costPerConversation ?? 0.005, 0, 100);
  const marginProfitRatio = clampNumber(payload.marginProfitRatio ?? 0.50, 0.01, 1);

  // AI calcs (your exact spec)
  const aiUsage = attendance * inquiryRatio;
  const expectedConversations = aiUsage * avgConvosPerGuest;
  const expectedCost = expectedConversations * costPerConversation;
  const grossProfit = expectedCost / marginProfitRatio;

  const aiQuotedPrice = toNumber(payload.aiQuotedPrice, grossProfit);

  const includeMaps = product === "maps" || product === "both";
  const includeAI = product === "ai" || product === "both";

  const showMapsOnlyCard = includeMaps;
  const showAiOnlyCard = includeAI;
  const showBundleCards = product === "both";

  const mapsOnlyTotal = (includeMaps ? mapsSubtotal + setupFee : 0);
  const aiOnlyTotal = aiQuotedPrice;
  const bundleTotal = (includeMaps ? mapsSubtotal + setupFee : 0) + aiQuotedPrice;

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

    // maps plan
    mapPlanKey,
    mapPlanName: mapPlan.name,
    mapPlanFeatures: mapPlan.features,
    mapUnitPrice,
    setupFee,
    maps: cleanedMaps,
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

    // cards
    showMapsOnlyCard,
    showAiOnlyCard,
    showBundleCards,

    preparedDate,
    validityDays,

    fmt: {
      mapUnitPrice: currency(mapUnitPrice),
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