const el = (id) => document.getElementById(id);

const verticalEl = el("vertical");
const clientNameEl = el("clientName");
const productEl = el("product");
const bundleChoiceWrap = el("bundleChoiceWrap");

const mapPlanEl = el("mapPlan");
const mapUnitPriceEl = el("mapUnitPrice");
const setupFeeEl = el("setupFee");
const mapsCountEl = el("mapsCount");
const btnApplyMapCount = el("btnApplyMapCount");
const mapsListEl = el("mapsList");

const attendanceEl = el("attendance");
const inquiryRatioEl = el("inquiryRatio");
const inquiryRatioLabel = el("inquiryRatioLabel");
const avgConvosEl = el("avgConvosPerGuest");
const avgConvosLabel = el("avgConvosLabel");
const costPerConversationEl = el("costPerConversation");
const marginEl = el("marginProfitRatio");
const marginLabel = el("marginLabel");

const aiUsageEl = el("aiUsage");
const expectedConvosEl = el("expectedConvos");
const expectedCostEl = el("expectedCost");
const grossProfitEl = el("grossProfit");
const aiQuotedPriceEl = el("aiQuotedPrice");

const btnPreview = el("btnPreview");
const btnPdf = el("btnPdf");
const previewFrame = el("previewFrame");

const MAP_PLAN_DEFAULTS = {
  basic: 10000,
  standard: 15000,
  premium: 20000
};

function fmtNumber(n, decimals = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(x);
}

function fmtCurrency(n, decimals = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(x);
}

function getBundleChoice() {
  const checked = document.querySelector('input[name="bundleChoice"]:checked');
  return checked ? checked.value : "ai_plus_maps";
}

function getMapsFromUI() {
  const inputs = mapsListEl.querySelectorAll("input[data-map-index]");
  return Array.from(inputs).map((inp) => ({ name: inp.value }));
}

function setMapRows(count) {
  const n = Math.max(0, Math.min(25, Number(count) || 0));
  const current = getMapsFromUI();
  mapsListEl.innerHTML = "";

  for (let i = 0; i < n; i++) {
    const row = document.createElement("div");
    row.className = "mapRow";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = `Map ${i + 1} Name`;

    const input = document.createElement("input");
    input.type = "text";
    input.value = (current[i]?.name || "").trim() || defaultMapName(i);
    input.setAttribute("data-map-index", String(i));

    row.appendChild(label);
    row.appendChild(input);
    mapsListEl.appendChild(row);
  }
}

function defaultMapName(i) {
  const v = verticalEl.value;
  if (v === "waterpark") return ["Roanoke Park Map", "Mansfield Park Map", "Waco Park Map"][i] || `Park Map ${i + 1}`;
  if (v === "zoo") return ["Main Zoo Map", "Kids Zone Map", "Safari Area Map"][i] || `Zoo Map ${i + 1}`;
  if (v === "farm") return ["Main Farm Map", "Attractions Map", "Seasonal Map"][i] || `Farm Map ${i + 1}`;
  return ["Main Venue Map", "Attractions Map", "Venue Map 3"][i] || `Map ${i + 1}`;
}

function toggleBundleChoice() {
  bundleChoiceWrap.style.display = productEl.value === "both" ? "block" : "none";
}

function applyMapPlanDefaultIfNotTouched() {
  const plan = mapPlanEl.value;
  const defaultPrice = MAP_PLAN_DEFAULTS[plan] ?? 10000;

  if (!mapUnitPriceEl.dataset.touched) {
    mapUnitPriceEl.value = defaultPrice;
  }
}

function calcAiLive() {
  const attendance = Number(attendanceEl.value) || 0;
  const inquiryRatio = (Number(inquiryRatioEl.value) || 0) / 100;
  const avgConvos = Number(avgConvosEl.value) || 0;
  const costPerConversation = Number(costPerConversationEl.value) || 0;
  const margin = (Number(marginEl.value) || 1) / 100;

  inquiryRatioLabel.textContent = `${Math.round(inquiryRatio * 100)}%`;
  avgConvosLabel.textContent = `${avgConvos}`;
  marginLabel.textContent = `${Math.round(margin * 100)}%`;

  const aiUsage = attendance * inquiryRatio;
  const expectedConvos = aiUsage * avgConvos;
  const expectedCost = expectedConvos * costPerConversation;
  const grossProfit = margin > 0 ? (expectedCost / margin) : 0;

  aiUsageEl.textContent = fmtNumber(aiUsage, 0);
  expectedConvosEl.textContent = fmtNumber(expectedConvos, 0);
  expectedCostEl.textContent = fmtCurrency(expectedCost, 0);
  grossProfitEl.textContent = fmtCurrency(grossProfit, 0);

  if (!aiQuotedPriceEl.value) {
    aiQuotedPriceEl.value = Math.round(grossProfit);
  }
}

function buildPayload() {
  return {
    vertical: verticalEl.value,
    clientName: clientNameEl.value,
    product: productEl.value,
    bundleChoice: getBundleChoice(),

    mapPlan: mapPlanEl.value,
    mapUnitPrice: Number(mapUnitPriceEl.value),
    setupFee: Number(setupFeeEl.value),
    maps: getMapsFromUI(),

    attendance: Number(attendanceEl.value),
    inquiryRatio: (Number(inquiryRatioEl.value) || 0) / 100,
    avgConvosPerGuest: Number(avgConvosEl.value),
    costPerConversation: Number(costPerConversationEl.value),
    marginProfitRatio: (Number(marginEl.value) || 1) / 100,

    aiQuotedPrice: aiQuotedPriceEl.value ? Number(aiQuotedPriceEl.value) : undefined
  };
}

async function updatePreview() {
  const payload = buildPayload();
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err?.error || "Preview failed");
    return;
  }

  const { html } = await res.json();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  previewFrame.src = url;
}

async function downloadPdf() {
  const payload = buildPayload();
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err?.error || "PDF generation failed");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const name = (clientNameEl.value || "proposal")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "proposal";

  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function wireEvents() {
  btnApplyMapCount.addEventListener("click", () => setMapRows(mapsCountEl.value));

  verticalEl.addEventListener("change", () => {
    const current = getMapsFromUI();
    setMapRows(current.length || Number(mapsCountEl.value) || 0);
  });

  productEl.addEventListener("change", () => toggleBundleChoice());

  mapPlanEl.addEventListener("change", () => applyMapPlanDefaultIfNotTouched());
  mapUnitPriceEl.addEventListener("input", () => {
    mapUnitPriceEl.dataset.touched = "1";
  });

  [attendanceEl, inquiryRatioEl, avgConvosEl, costPerConversationEl, marginEl].forEach((x) => {
    x.addEventListener("input", () => {
      if (!aiQuotedPriceEl.dataset.touched) aiQuotedPriceEl.value = "";
      calcAiLive();
    });
  });

  aiQuotedPriceEl.addEventListener("input", () => {
    aiQuotedPriceEl.dataset.touched = "1";
  });

  btnPreview.addEventListener("click", updatePreview);
  btnPdf.addEventListener("click", downloadPdf);
}

function init() {
  toggleBundleChoice();
  setMapRows(mapsCountEl.value);
  applyMapPlanDefaultIfNotTouched();
  calcAiLive();
  wireEvents();
  updatePreview().catch(() => {});
}

init();