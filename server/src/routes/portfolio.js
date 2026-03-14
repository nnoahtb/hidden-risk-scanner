const express = require("express");
const router = express.Router();
const { analyzePortfolio } = require("../services/riskAnalyzer");
const { findFund, FUND_DATABASE } = require("../data/fundData");

/**
 * POST /api/analyze
 * Body: { portfolio: [{ name: string, allocation: number }] }
 */
router.post("/analyze", (req, res) => {
  const { portfolio } = req.body;

  if (!Array.isArray(portfolio) || portfolio.length === 0) {
    return res.status(400).json({ error: "Portfolio must be a non-empty array." });
  }

  for (const entry of portfolio) {
    if (!entry.name || typeof entry.allocation !== "number" || entry.allocation <= 0) {
      return res.status(400).json({
        error: `Invalid entry: each item needs a name and a positive allocation. Got: ${JSON.stringify(entry)}`,
      });
    }
  }

  try {
    const result = analyzePortfolio(portfolio);
    return res.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

/**
 * GET /api/funds
 * Returns list of supported fund names for autocomplete.
 */
router.get("/funds", (req, res) => {
  const funds = Object.values(FUND_DATABASE).map((f) => ({
    id: f.id,
    displayName: f.displayName,
    type: f.type,
    region: f.region,
  }));
  res.json(funds);
});

/**
 * GET /api/funds/search?q=avanza
 */
router.get("/funds/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  if (!q) return res.json([]);

  const results = Object.values(FUND_DATABASE)
    .filter((f) => f.displayName.toLowerCase().includes(q) || f.id.includes(q))
    .map((f) => ({ id: f.id, displayName: f.displayName, type: f.type }));

  res.json(results);
});

module.exports = router;
