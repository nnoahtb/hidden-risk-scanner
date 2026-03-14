/**
 * analyzePortfolio
 *
 * Calculates combined exposure across all funds based on the user's allocation.
 *
 * @param {Array<{ name: string, allocation: number }>} portfolio
 *   e.g. [{ name: "Avanza Global", allocation: 60 }, { name: "Spiltan Aktiefond", allocation: 40 }]
 *
 * @param {Object} fundDatabase
 *   Keyed by lowercase fund name. Each entry has:
 *     holdings: Array<{ name, ticker, sector, region, weight }>
 *     sectorBreakdown: { [sector]: number }
 *     regionBreakdown: { [region]: number }
 *
 * @returns {{
 *   topCompanies: Array<{ name, ticker, sector, region, effectiveWeight, fundCount }>,
 *   sectorExposure: Array<{ name, value }>,
 *   countryExposure: Array<{ name, value }>,
 *   concentrationScore: number,   // 1–10
 *   matchedFunds: string[],
 *   unknownFunds: string[],
 * }}
 */
export function analyzePortfolio(portfolio, fundDatabase) {
  // ── 1. Resolve fund names ──────────────────────────────────────────────────
  const totalAllocation = portfolio.reduce((sum, p) => sum + p.allocation, 0);

  const resolved = portfolio.map((entry) => {
    const fund = findFund(entry.name, fundDatabase);
    return {
      name: entry.name,
      // Normalize so weights always reflect a full 100 % portfolio
      weight: (entry.allocation / totalAllocation) * 100,
      fund,
    };
  });

  const matched  = resolved.filter((r) => r.fund);
  const unknown  = resolved.filter((r) => !r.fund).map((r) => r.name);

  // ── 2. Aggregate stock-level exposure ──────────────────────────────────────
  const stockMap = {};

  matched.forEach(({ fund, weight: fundWeight }) => {
    fund.holdings.forEach((holding) => {
      // Effective weight = fund's portfolio share × holding's weight inside the fund
      const effective = (fundWeight / 100) * holding.weight;
      const key = holding.ticker ?? holding.name;

      if (!stockMap[key]) {
        stockMap[key] = {
          name:            holding.name,
          ticker:          holding.ticker ?? null,
          sector:          holding.sector ?? "Unknown",
          region:          holding.region ?? "Unknown",
          effectiveWeight: 0,
          fundCount:       0,
        };
      }

      stockMap[key].effectiveWeight += effective;
      stockMap[key].fundCount       += 1;
    });
  });

  const topCompanies = Object.values(stockMap)
    .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
    .slice(0, 10)
    .map((s) => ({ ...s, effectiveWeight: round2(s.effectiveWeight) }));

  // ── 3. Sector exposure ─────────────────────────────────────────────────────
  const sectorMap = {};

  matched.forEach(({ fund, weight: fundWeight }) => {
    Object.entries(fund.sectorBreakdown).forEach(([sector, pct]) => {
      sectorMap[sector] = (sectorMap[sector] ?? 0) + (fundWeight / 100) * pct;
    });
  });

  const sectorExposure = sortedPairs(sectorMap);

  // ── 4. Country / region exposure ──────────────────────────────────────────
  const regionMap = {};

  matched.forEach(({ fund, weight: fundWeight }) => {
    Object.entries(fund.regionBreakdown).forEach(([region, pct]) => {
      regionMap[region] = (regionMap[region] ?? 0) + (fundWeight / 100) * pct;
    });
  });

  const countryExposure = sortedPairs(regionMap);

  // ── 5. Concentration score (1–10) ─────────────────────────────────────────
  const concentrationScore = calcConcentrationScore(
    topCompanies,
    sectorExposure,
    countryExposure
  );

  return {
    topCompanies,
    sectorExposure,
    countryExposure,
    concentrationScore,
    matchedFunds: matched.map((r) => r.fund.displayName),
    unknownFunds: unknown,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Convert a { [name]: number } map into sorted [{ name, value }] pairs. */
function sortedPairs(map) {
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Fuzzy-match a user-supplied name against fundDatabase keys.
 * Tries exact match → substring match → displayName match.
 */
function findFund(name, fundDatabase) {
  const key = name.toLowerCase().trim();

  if (fundDatabase[key]) return fundDatabase[key];

  for (const [dbKey, fund] of Object.entries(fundDatabase)) {
    if (dbKey.includes(key) || key.includes(dbKey)) return fund;
    if (fund.displayName?.toLowerCase().includes(key))  return fund;
  }

  return null;
}

/**
 * Concentration score from 1 (well-diversified) to 10 (highly concentrated).
 *
 * Three signals, weighted equally:
 *   A) Top-stock concentration  — how much weight is in the single biggest holding
 *   B) Sector concentration     — how much is in the single biggest sector
 *   C) Region concentration     — how much is in the single biggest region
 *
 * Each signal is scaled to 0–10 via thresholds derived from typical portfolios,
 * then the three scores are averaged and rounded.
 */
function calcConcentrationScore(topCompanies, sectorExposure, countryExposure) {
  // A) Top stock: 1 % → score 1, 15 %+ → score 10
  const topStockPct = topCompanies[0]?.effectiveWeight ?? 0;
  const stockScore  = clamp((topStockPct - 1) / 14, 0, 1);

  // B) Top sector: 20 % → score 1, 85 %+ → score 10
  const topSectorPct = sectorExposure[0]?.value ?? 0;
  const sectorScore  = clamp((topSectorPct - 20) / 65, 0, 1);

  // C) Top region: 40 % → score 1, 90 %+ → score 10
  const topRegionPct = countryExposure[0]?.value ?? 0;
  const regionScore  = clamp((topRegionPct - 40) / 50, 0, 1);

  // Herfindahl-style bonus: penalize many overlapping top stocks
  const top5Weight   = topCompanies.slice(0, 5).reduce((s, c) => s + c.effectiveWeight, 0);
  const herfBonus    = clamp((top5Weight - 10) / 40, 0, 1);

  const raw = (stockScore * 0.3 + sectorScore * 0.3 + regionScore * 0.2 + herfBonus * 0.2);

  // Map 0–1 → 1–10
  return Math.max(1, Math.min(10, Math.round(raw * 9 + 1)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
