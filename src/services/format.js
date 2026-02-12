function clampNumber(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function toNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function currency(n, { decimals = 0 } = {}) {
  const x = toNumber(n, 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(x);
}

function number(n, { decimals = 0 } = {}) {
  const x = toNumber(n, 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(x);
}

function percent(n, { decimals = 0 } = {}) {
  const x = toNumber(n, 0);
  return `${(x * 100).toFixed(decimals)}%`;
}

module.exports = {
  clampNumber,
  toNumber,
  currency,
  number,
  percent
};
