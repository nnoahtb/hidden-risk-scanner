/**
 * generateInsights
 *
 * Produces plain-language insight objects from an analyzePortfolio() result.
 *
 * Each insight has:
 *   { id, level, category, headline, detail }
 *
 *   level    — "danger" | "warning" | "info" | "positive"
 *   category — "sector" | "region" | "company" | "overlap" | "diversification"
 */
export function generateInsights({ topCompanies, sectorExposure, countryExposure, concentrationScore }) {
  const insights = [];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const pct  = (n) => `${Math.round(n)}%`;
  const pct1 = (n) => `${n.toFixed(1)}%`;

  // ── 1. Top sector exposure ────────────────────────────────────────────────
  const topSector = sectorExposure[0];
  if (topSector) {
    const v = topSector.value;
    insights.push({
      id: "top-sector",
      level: v > 60 ? "danger" : v > 40 ? "warning" : "info",
      category: "sector",
      headline: `${pct(v)} of your portfolio is in ${topSector.name}.`,
      detail: v > 60
        ? `This is a very high concentration. A sector-wide downturn could have a severe impact on your returns.`
        : v > 40
        ? `This is an elevated concentration. Consider whether you are comfortable with this level of sector risk.`
        : `This is a moderate allocation. Keep an eye on it if ${topSector.name} conditions change.`,
    });
  }

  // ── 2. Tech + North America combo insight ─────────────────────────────────
  const techPct   = sectorExposure.find((s) => s.name === "Technology")?.value  ?? 0;
  const usPct     = countryExposure.find((r) => r.name === "North America")?.value ?? 0;
  if (techPct > 30 && usPct > 50) {
    insights.push({
      id: "tech-us-combo",
      level: techPct > 50 ? "danger" : "warning",
      category: "sector",
      headline: `Your portfolio has ${pct(techPct)} exposure to technology and ${pct(usPct)} in North America.`,
      detail: `These two concentrations overlap heavily — most of your tech exposure is US mega-cap stocks. A US tech correction would affect both dimensions simultaneously.`,
    });
  }

  // ── 3. Top region exposure ────────────────────────────────────────────────
  const topRegion = countryExposure[0];
  if (topRegion) {
    const v = topRegion.value;
    insights.push({
      id: "top-region",
      level: v > 75 ? "warning" : "info",
      category: "region",
      headline: `${pct(v)} of your portfolio is in ${topRegion.name}.`,
      detail: v > 75
        ? `Heavy geographic concentration. Currency risk, regulatory changes, or a regional recession would have an outsized effect on your portfolio.`
        : `Most of your portfolio is in a single region. This is common for global index funds but worth monitoring.`,
    });
  }

  // ── 4. Top 3 companies concentration ─────────────────────────────────────
  const top3 = topCompanies.slice(0, 3);
  if (top3.length > 0) {
    const top3Weight = top3.reduce((s, c) => s + c.effectiveWeight, 0);
    const names      = top3.map((c) => c.name).join(", ");
    insights.push({
      id: "top3-companies",
      level: top3Weight > 15 ? "warning" : "info",
      category: "company",
      headline: `Your top 3 companies (${names}) represent ${pct1(top3Weight)} of your portfolio.`,
      detail: top3Weight > 15
        ? `High single-stock concentration. If any of these companies underperform significantly, your portfolio will feel it.`
        : `Moderate individual stock exposure. This is typical for market-cap-weighted index funds.`,
    });
  }

  // ── 5. Biggest single holding ─────────────────────────────────────────────
  const biggest = topCompanies[0];
  if (biggest && biggest.effectiveWeight > 3) {
    insights.push({
      id: "biggest-holding",
      level: biggest.effectiveWeight > 6 ? "danger" : "warning",
      category: "company",
      headline: `${biggest.name} is your single largest holding at ${pct1(biggest.effectiveWeight)} of your portfolio.`,
      detail: biggest.fundCount > 1
        ? `It appears in ${biggest.fundCount} of your funds — you are buying it multiple times without realising it.`
        : `Even through a single fund, this is a significant position in one company.`,
    });
  }

  // ── 6. Hidden double-exposure (stocks in 2+ funds) ────────────────────────
  const overlapping = topCompanies.filter((c) => c.fundCount > 1);
  if (overlapping.length > 0) {
    const totalOverlap = overlapping.reduce((s, c) => s + c.effectiveWeight, 0);
    const names        = overlapping.slice(0, 3).map((c) => c.name).join(", ");
    insights.push({
      id: "hidden-overlap",
      level: overlapping.length >= 4 ? "danger" : "warning",
      category: "overlap",
      headline: `${overlapping.length} stock${overlapping.length > 1 ? "s appear" : " appears"} in multiple funds, adding up to ${pct1(totalOverlap)} hidden double-exposure.`,
      detail: `Stocks like ${names} are held by more than one of your funds. Your actual concentration in these names is higher than any single fund's factsheet suggests.`,
    });
  }

  // ── 7. Sector shock scenario ──────────────────────────────────────────────
  const shockSector = sectorExposure[0];
  if (shockSector && shockSector.value > 20) {
    const drop20 = (shockSector.value * 0.20) / 100;  // portfolio impact of a 20% sector drop
    insights.push({
      id: "sector-shock",
      level: drop20 > 0.08 ? "warning" : "info",
      category: "sector",
      headline: `If ${shockSector.name} falls 20%, your portfolio may drop about ${pct1(drop20 * 100)}.`,
      detail: `This is a rough estimate based on your ${pct(shockSector.value)} ${shockSector.name} exposure, assuming other sectors hold steady. Actual impact depends on correlations and fund-level diversification.`,
    });
  }

  // ── 8. Second-largest sector worth flagging ───────────────────────────────
  const secondSector = sectorExposure[1];
  if (secondSector && secondSector.value > 15) {
    insights.push({
      id: "second-sector",
      level: "info",
      category: "sector",
      headline: `${secondSector.name} is your second-largest sector at ${pct(secondSector.value)} of your portfolio.`,
      detail: `Combined with your top sector, these two account for ${pct((sectorExposure[0]?.value ?? 0) + secondSector.value)} of your portfolio.`,
    });
  }

  // ── 9. Diversification positive ───────────────────────────────────────────
  const sectorCount = sectorExposure.filter((s) => s.value > 5).length;
  if (sectorCount >= 4) {
    insights.push({
      id: "sector-diversification",
      level: "positive",
      category: "diversification",
      headline: `Your portfolio is spread across ${sectorCount} meaningful sectors.`,
      detail: `Having exposure to ${sectorCount} sectors with more than 5% weight each provides reasonable sector diversification.`,
    });
  }

  // ── 10. Low concentration score positive ─────────────────────────────────
  if (concentrationScore <= 3) {
    insights.push({
      id: "low-concentration",
      level: "positive",
      category: "diversification",
      headline: `Your Hidden Risk Score is ${concentrationScore}/10 — well diversified.`,
      detail: `No single stock, sector, or region dominates your portfolio. This is a healthy starting point, though hidden overlaps may still exist.`,
    });
  }

  // ── 11. High concentration score warning ─────────────────────────────────
  if (concentrationScore >= 8) {
    insights.push({
      id: "high-concentration",
      level: "danger",
      category: "diversification",
      headline: `Your Hidden Risk Score is ${concentrationScore}/10 — significant concentration detected.`,
      detail: `Your portfolio is heavily concentrated in a small number of stocks, sectors, or regions. Consider adding uncorrelated assets to reduce risk.`,
    });
  }

  return insights;
}
