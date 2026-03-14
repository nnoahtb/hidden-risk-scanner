const { findFund } = require("../data/fundData");

/**
 * Analyze a portfolio for hidden concentration risk.
 *
 * @param {Array<{name: string, allocation: number}>} portfolio
 * @returns {Object} Full analysis result
 */
function analyzePortfolio(portfolio) {
  const totalAllocation = portfolio.reduce((s, p) => s + p.allocation, 0);

  // Resolve each fund
  const resolvedFunds = portfolio.map((entry) => {
    const fund = findFund(entry.name);
    return {
      inputName: entry.name,
      allocation: entry.allocation,
      allocationPct: (entry.allocation / totalAllocation) * 100,
      fund,
    };
  });

  const unknownFunds = resolvedFunds.filter((f) => !f.fund).map((f) => f.inputName);
  const knownFunds = resolvedFunds.filter((f) => f.fund);

  // ── 1. Effective sector breakdown ────────────────────────────────────────
  const effectiveSectors = {};
  knownFunds.forEach(({ fund, allocationPct }) => {
    Object.entries(fund.sectorBreakdown).forEach(([sector, weight]) => {
      effectiveSectors[sector] = (effectiveSectors[sector] || 0) + (weight * allocationPct) / 100;
    });
  });

  // ── 2. Effective region breakdown ────────────────────────────────────────
  const effectiveRegions = {};
  knownFunds.forEach(({ fund, allocationPct }) => {
    Object.entries(fund.regionBreakdown).forEach(([region, weight]) => {
      effectiveRegions[region] = (effectiveRegions[region] || 0) + (weight * allocationPct) / 100;
    });
  });

  // ── 3. Top underlying stock positions (aggregated) ───────────────────────
  const stockMap = {};
  knownFunds.forEach(({ fund, allocationPct }) => {
    fund.holdings.forEach((holding) => {
      const effectiveWeight = (holding.weight * allocationPct) / 100;
      const key = holding.ticker;
      if (!stockMap[key]) {
        stockMap[key] = {
          name: holding.name,
          ticker: holding.ticker,
          sector: holding.sector,
          region: holding.region,
          totalWeight: 0,
          appearsIn: [],
        };
      }
      stockMap[key].totalWeight += effectiveWeight;
      stockMap[key].appearsIn.push({
        fundName: fund.displayName,
        weight: holding.weight,
        effectiveWeight: round2(effectiveWeight),
      });
    });
  });

  const topStocks = Object.values(stockMap)
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .slice(0, 15)
    .map((s) => ({ ...s, totalWeight: round2(s.totalWeight) }));

  // ── 4. Overlap matrix (pairwise) ─────────────────────────────────────────
  const overlapMatrix = buildOverlapMatrix(knownFunds);

  // ── 5. Risk scores ────────────────────────────────────────────────────────
  const riskScores = computeRiskScores(effectiveSectors, effectiveRegions, topStocks, knownFunds);

  // ── 6. Key warnings ───────────────────────────────────────────────────────
  const warnings = generateWarnings(effectiveSectors, effectiveRegions, topStocks, knownFunds, riskScores);

  return {
    summary: {
      fundCount: knownFunds.length,
      unknownFunds,
      totalAllocationInput: totalAllocation,
    },
    funds: knownFunds.map(({ inputName, allocation, allocationPct, fund }) => ({
      inputName,
      displayName: fund.displayName,
      allocation,
      allocationPct: round2(allocationPct),
      type: fund.type,
      region: fund.region,
      ter: fund.ter,
    })),
    effectiveSectors: sortedEntries(effectiveSectors),
    effectiveRegions: sortedEntries(effectiveRegions),
    topStocks,
    overlapMatrix,
    riskScores,
    warnings,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

function sortedEntries(obj) {
  return Object.entries(obj)
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Build a pairwise overlap score between all fund pairs.
 * Overlap = sum of min(weightA, weightB) for shared tickers.
 */
function buildOverlapMatrix(knownFunds) {
  const matrix = [];

  for (let i = 0; i < knownFunds.length; i++) {
    const row = [];
    for (let j = 0; j < knownFunds.length; j++) {
      if (i === j) {
        row.push({ fundA: knownFunds[i].fund.displayName, fundB: knownFunds[j].fund.displayName, overlap: 100 });
        continue;
      }

      const holdingsA = Object.fromEntries(knownFunds[i].fund.holdings.map((h) => [h.ticker, h.weight]));
      const holdingsB = Object.fromEntries(knownFunds[j].fund.holdings.map((h) => [h.ticker, h.weight]));

      let overlapScore = 0;
      Object.keys(holdingsA).forEach((ticker) => {
        if (holdingsB[ticker]) {
          overlapScore += Math.min(holdingsA[ticker], holdingsB[ticker]);
        }
      });

      row.push({
        fundA: knownFunds[i].fund.displayName,
        fundB: knownFunds[j].fund.displayName,
        overlap: round2(overlapScore),
      });
    }
    matrix.push(row);
  }

  return matrix;
}

/**
 * Compute individual risk scores (0–100) and an overall risk score.
 */
function computeRiskScores(sectors, regions, topStocks, knownFunds) {
  // Concentration score: how much of the portfolio is in the top sector
  const sectorValues = Object.values(sectors);
  const topSectorPct = Math.max(...sectorValues, 0);
  const sectorConcentration = Math.min(100, Math.round((topSectorPct / 60) * 100));

  // Region concentration
  const regionValues = Object.values(regions);
  const topRegionPct = Math.max(...regionValues, 0);
  const regionConcentration = Math.min(100, Math.round((topRegionPct / 80) * 100));

  // Stock overlap: single stock over 3% effective weight is a risk
  const highConcentrationStocks = topStocks.filter((s) => s.totalWeight > 3).length;
  const stockConcentration = Math.min(100, highConcentrationStocks * 20);

  // Fund overlap: average off-diagonal overlap
  const pairOverlaps = [];
  for (let i = 0; i < knownFunds.length; i++) {
    for (let j = i + 1; j < knownFunds.length; j++) {
      const hA = Object.fromEntries(knownFunds[i].fund.holdings.map((h) => [h.ticker, h.weight]));
      const hB = Object.fromEntries(knownFunds[j].fund.holdings.map((h) => [h.ticker, h.weight]));
      let ol = 0;
      Object.keys(hA).forEach((t) => { if (hB[t]) ol += Math.min(hA[t], hB[t]); });
      pairOverlaps.push(ol);
    }
  }
  const avgOverlap = pairOverlaps.length ? pairOverlaps.reduce((a, b) => a + b, 0) / pairOverlaps.length : 0;
  const fundOverlap = Math.min(100, Math.round((avgOverlap / 15) * 100));

  const overall = Math.round((sectorConcentration * 0.35 + regionConcentration * 0.25 + stockConcentration * 0.25 + fundOverlap * 0.15));

  return {
    overall,
    sectorConcentration,
    regionConcentration,
    stockConcentration,
    fundOverlap,
    label: riskLabel(overall),
  };
}

function riskLabel(score) {
  if (score < 30) return "Low";
  if (score < 55) return "Moderate";
  if (score < 75) return "High";
  return "Very High";
}

function generateWarnings(sectors, regions, topStocks, knownFunds, riskScores) {
  const warnings = [];

  // Sector warnings
  const sectorEntries = sortedEntries(sectors);
  if (sectorEntries[0]?.value > 45) {
    warnings.push({
      level: "danger",
      title: `Heavy ${sectorEntries[0].name} concentration`,
      detail: `${round2(sectorEntries[0].value)}% of your effective portfolio is in ${sectorEntries[0].name}. A sector downturn could severely impact returns.`,
    });
  }

  // Region warnings
  const regionEntries = sortedEntries(regions);
  if (regionEntries[0]?.value > 65) {
    warnings.push({
      level: "warning",
      title: `Geographic concentration in ${regionEntries[0].name}`,
      detail: `${round2(regionEntries[0].value)}% of your effective exposure is in ${regionEntries[0].name}.`,
    });
  }

  // Single stock warnings
  const bigStocks = topStocks.filter((s) => s.totalWeight > 3);
  if (bigStocks.length > 0) {
    bigStocks.forEach((s) => {
      warnings.push({
        level: s.totalWeight > 5 ? "danger" : "warning",
        title: `${s.name} appears in ${s.appearsIn.length} fund(s)`,
        detail: `Effective exposure: ${round2(s.totalWeight)}% of portfolio. Hidden double-counting across funds.`,
      });
    });
  }

  // Overlap warnings
  if (riskScores.fundOverlap > 50) {
    warnings.push({
      level: "warning",
      title: "High fund overlap detected",
      detail: "Your funds hold many of the same underlying stocks, reducing true diversification.",
    });
  }

  // Tech-specific check
  const techPct = sectors["Technology"] || 0;
  if (techPct > 40) {
    warnings.push({
      level: "info",
      title: "Mega-cap tech dominates your portfolio",
      detail: `~${round2(techPct)}% tech exposure — primarily US mega-caps (Apple, Microsoft, NVIDIA). Consider defensive or value tilt.`,
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      level: "success",
      title: "Portfolio looks reasonably diversified",
      detail: "No major concentration risks detected based on available fund data.",
    });
  }

  return warnings;
}

module.exports = { analyzePortfolio };
