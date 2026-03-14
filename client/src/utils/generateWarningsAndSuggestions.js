/**
 * generateWarningsAndSuggestions
 *
 * Produces plain-language risk warnings and actionable suggestions
 * from an analyzePortfolio() result.
 *
 * @returns {{
 *   warnings:    Array<{ title, description, riskLevel, impact? }>,
 *   suggestions: Array<{ title, description, riskLevel }>,
 * }}
 *
 * riskLevel — "high" | "medium" | "low"
 *
 * impact (warnings only, when calculable):
 *   {
 *     scenario:      string,   // e.g. "if Apple drops 30%"
 *     estimatedDrop: number,   // portfolio percentage points lost
 *   }
 */
export function generateWarningsAndSuggestions({
  topCompanies,
  sectorExposure,
  countryExposure,
  concentrationScore,
}) {
  const warnings    = [];
  const suggestions = [];

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const pct  = (n) => `${Math.round(n)}%`;
  const pct1 = (n) => `${parseFloat(n.toFixed(1))}%`;

  /**
   * Build an impact object.
   * estimatedDrop = exposurePct * (dropPct / 100)  (in portfolio percentage points)
   */
  function impact(scenario, exposurePct, dropPct) {
    return {
      scenario,
      estimatedDrop: parseFloat(((exposurePct / 100) * dropPct).toFixed(2)),
    };
  }

  function addWarning(title, description, riskLevel, impactObj = null) {
    const w = { title, description, riskLevel };
    if (impactObj) w.impact = impactObj;
    warnings.push(w);
  }

  function addSuggestion(title, description, riskLevel) {
    suggestions.push({ title, description, riskLevel });
  }

  // ── WARNINGS ─────────────────────────────────────────────────────────────────

  // 1. Company shock scenarios
  topCompanies.slice(0, 5).forEach((company) => {
    if (company.effectiveWeight < 2) return;

    if (company.effectiveWeight >= 6) {
      addWarning(
        `High exposure to ${company.name}`,
        `${company.name} is ${pct1(company.effectiveWeight)} of your portfolio.` +
        (company.fundCount > 1 ? ` It appears in ${company.fundCount} of your funds.` : ""),
        "high",
        impact(`if ${company.name} drops 30%`, company.effectiveWeight, 30)
      );
    } else if (company.effectiveWeight >= 3) {
      addWarning(
        `Significant exposure to ${company.name}`,
        `${company.name} makes up ${pct1(company.effectiveWeight)} of your portfolio.` +
        (company.fundCount > 1 ? ` Held across ${company.fundCount} funds.` : ""),
        "medium",
        impact(`if ${company.name} drops 50%`, company.effectiveWeight, 50)
      );
    } else {
      addWarning(
        `Noticeable position in ${company.name}`,
        `${company.name} represents ${pct1(company.effectiveWeight)} of your portfolio.`,
        "low",
        impact(`if ${company.name} drops 30%`, company.effectiveWeight, 30)
      );
    }
  });

  // 2. Hidden double-exposure
  const overlapping = topCompanies.filter((c) => c.fundCount > 1);
  if (overlapping.length > 0) {
    const names       = overlapping.slice(0, 3).map((c) => c.name).join(", ");
    const totalWeight = overlapping.reduce((s, c) => s + c.effectiveWeight, 0);
    addWarning(
      "Hidden double exposure in your funds",
      `${overlapping.length} stock${overlapping.length > 1 ? "s" : ""} — including ${names} — ` +
      `appear in multiple funds, giving you ${pct1(totalWeight)} more concentration than you may realise.`,
      overlapping.length >= 4 ? "high" : "medium",
      impact(`if these overlapping stocks drop 30%`, totalWeight, 30)
    );
  }

  // 3. Sector concentration
  const topSector = sectorExposure[0];
  if (topSector) {
    const v = topSector.value;
    if (v > 55) {
      addWarning(
        `Very high ${topSector.name} sector concentration`,
        `${pct(v)} of your portfolio is in ${topSector.name}. A sector-wide downturn could hit hard.`,
        "high",
        impact(`if ${topSector.name} drops 20%`, v, 20)
      );
    } else if (v > 35) {
      addWarning(
        `High exposure to ${topSector.name}`,
        `${pct(v)} of your money is in ${topSector.name} stocks. ` +
        `If this sector underperforms, it will have an outsized impact on your returns.`,
        "medium",
        impact(`if ${topSector.name} drops 20%`, v, 20)
      );
    }
  }

  // 4. US technology combined warning
  const techPct = sectorExposure.find((s) => s.name === "Technology")?.value ?? 0;
  const usPct   = countryExposure.find((r) => r.name === "North America")?.value ?? 0;
  if (techPct > 30 && usPct > 55) {
    addWarning(
      "Your portfolio has high exposure to US technology",
      `${pct(techPct)} in Technology and ${pct(usPct)} in North America. ` +
      `Most of your tech holdings are US mega-cap stocks — they tend to move together.`,
      techPct > 50 ? "high" : "medium",
      impact(`if US tech drops 20%`, techPct, 20)
    );
  }

  // 5. Geographic concentration
  const topRegion = countryExposure[0];
  if (topRegion && topRegion.value > 70) {
    addWarning(
      `Heavy concentration in ${topRegion.name}`,
      `${pct(topRegion.value)} of your portfolio is in ${topRegion.name}. ` +
      `A regional downturn or currency move could hit your portfolio hard.`,
      topRegion.value > 85 ? "high" : "medium",
      impact(`if ${topRegion.name} drops 15%`, topRegion.value, 15)
    );
  }

  // 6. Overall concentration score (no single asset, so no impact estimate)
  if (concentrationScore >= 8) {
    addWarning(
      "Overall portfolio concentration is very high",
      `Your Hidden Risk Score is ${concentrationScore}/10. ` +
      `Your portfolio is heavily concentrated — small moves in a few assets could cause big swings.`,
      "high"
    );
  } else if (concentrationScore >= 6) {
    addWarning(
      "Overall portfolio concentration is elevated",
      `Your Hidden Risk Score is ${concentrationScore}/10. ` +
      `Consider spreading your holdings more broadly to reduce volatility.`,
      "medium"
    );
  }

  // ── SUGGESTIONS ──────────────────────────────────────────────────────────────

  const sectorNames   = new Set(sectorExposure.map((s) => s.name));
  const hasHealthcare = sectorNames.has("Healthcare");
  const hasIndustrial = sectorNames.has("Industrials");
  const hasFinancials = sectorNames.has("Financials");
  const hasEnergy     = sectorNames.has("Energy");
  const europePct     = countryExposure.find((r) => r.name === "Europe")?.value    ?? 0;
  const emergingPct   = countryExposure.find((r) => r.name === "Emerging")?.value  ?? 0;
  const healthcarePct = sectorExposure.find((s) => s.name === "Healthcare")?.value ?? 0;
  const industrialPct = sectorExposure.find((s) => s.name === "Industrials")?.value ?? 0;

  if (usPct > 65 && europePct < 15) {
    addSuggestion(
      "Add a Europe index fund to reduce US exposure",
      `Your portfolio is ${pct(usPct)} North America. A European index fund ` +
      `(e.g. a Euro Stoxx 50 fund) would add geographic balance and reduce currency risk.`,
      "high"
    );
  }

  if (emergingPct < 5 && usPct > 50) {
    addSuggestion(
      "Consider adding some emerging market exposure",
      `You have almost no exposure to emerging markets. ` +
      `Adding a small allocation (5–10%) could improve long-term diversification.`,
      "low"
    );
  }

  if (techPct > 40) {
    const missing = [];
    if (!hasHealthcare || healthcarePct < 5) missing.push("healthcare");
    if (!hasIndustrial  || industrialPct < 5) missing.push("industrials");
    if (!hasEnergy) missing.push("energy");
    if (missing.length > 0) {
      addSuggestion(
        `Adding a ${missing[0]} fund could improve diversification`,
        `With ${pct(techPct)} in Technology, adding a ${missing.join(" or ")} fund ` +
        `would balance your sector mix with less correlated assets.`,
        techPct > 55 ? "high" : "medium"
      );
    }
  }

  if (!hasHealthcare) {
    addSuggestion(
      "A healthcare fund could add defensive exposure",
      `Healthcare stocks tend to hold up better during market downturns. ` +
      `Adding a healthcare or pharmaceutical fund would bring more stability to your portfolio.`,
      "medium"
    );
  }

  if (!hasFinancials && techPct > 30) {
    addSuggestion(
      "Consider adding financial sector exposure",
      `Your portfolio has no significant Financials exposure. ` +
      `Banks and financial stocks tend to be less correlated with Technology, reducing volatility.`,
      "low"
    );
  }

  if (overlapping.length >= 3) {
    addSuggestion(
      "Consider consolidating overlapping funds",
      `Several of your funds hold the same stocks. ` +
      `Replacing one with a different asset class (e.g. bonds or small-cap stocks) ` +
      `would give you more genuine diversification.`,
      "medium"
    );
  }

  const dangerStock = topCompanies.find((c) => c.effectiveWeight >= 6);
  if (dangerStock) {
    addSuggestion(
      `Reduce your indirect position in ${dangerStock.name}`,
      `${dangerStock.name} is ${pct1(dangerStock.effectiveWeight)} of your portfolio. ` +
      `Trimming the fund(s) with the heaviest ${dangerStock.name} weighting would lower your single-stock risk.`,
      "high"
    );
  }

  if (concentrationScore <= 3 && warnings.length <= 2) {
    addSuggestion(
      "Your portfolio looks well diversified — keep it up",
      `You have broad sector and geographic coverage with no single stock dominating. ` +
      `Consider reviewing your allocation once or twice a year to stay balanced.`,
      "low"
    );
  }

  return { warnings, suggestions };
}
