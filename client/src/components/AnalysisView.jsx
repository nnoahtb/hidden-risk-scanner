import React, { useState } from "react";
import RiskScore from "./RiskScore";
import { SectorPieChart, RegionPieChart, TopStocksBarChart, OverlapHeatmap } from "./RiskCharts";

const WARNING_ICONS = {
  danger:  "⚠",
  warning: "◆",
  info:    "●",
  success: "✓",
};

export default function AnalysisView({ analysis, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  const fundNames = analysis.funds.map((f) => f.displayName);

  return (
    <div className="analysis-page">
      {/* Header */}
      <div className="analysis-header">
        <div>
          <h1>Portfolio Risk Analysis</h1>
          <p>
            {analysis.funds.length} fund{analysis.funds.length !== 1 ? "s" : ""} analyzed
            {analysis.summary.unknownFunds.length > 0 && (
              <span style={{ color: "var(--yellow-500)", marginLeft: 8 }}>
                · {analysis.summary.unknownFunds.length} fund(s) not recognized
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          New analysis
        </button>
      </div>

      {/* Risk score strip */}
      <RiskScore scores={analysis.riskScores} />

      {/* Warnings */}
      <div className="warnings-list">
        {analysis.warnings.map((w, i) => (
          <div key={i} className={`warning-item ${w.level}`}>
            <span className="warning-icon">{WARNING_ICONS[w.level]}</span>
            <div className="warning-body">
              <strong>{w.title}</strong>
              <span>{w.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--gray-200)", paddingBottom: 0 }}>
        {["overview", "holdings", "overlap"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              color: activeTab === tab ? "var(--blue-600)" : "var(--gray-500)",
              borderBottom: activeTab === tab ? "2px solid var(--blue-600)" : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <>
          {/* Funds table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">
              <div className="icon">◻</div>
              Portfolio Composition
            </div>
            <table className="fund-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Type</th>
                  <th>Allocation</th>
                  <th>TER</th>
                </tr>
              </thead>
              <tbody>
                {analysis.funds.map((f, i) => (
                  <tr key={i}>
                    <td className="fund-name-cell">
                      <strong>{f.displayName}</strong>
                      <span>{f.region}</span>
                    </td>
                    <td><span className="type-chip">{f.type}</span></td>
                    <td>
                      <span className="alloc-chip">{f.allocationPct.toFixed(1)}%</span>
                    </td>
                    <td style={{ color: "var(--gray-500)", fontSize: 12 }}>
                      {f.ter != null ? `${f.ter}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts row */}
          <div className="analysis-grid">
            <div className="card">
              <div className="card-title">
                <div className="icon">◑</div>
                Effective Sector Exposure
              </div>
              <SectorPieChart data={analysis.effectiveSectors} />
            </div>
            <div className="card">
              <div className="card-title">
                <div className="icon">◑</div>
                Effective Region Exposure
              </div>
              <RegionPieChart data={analysis.effectiveRegions} />
            </div>
          </div>
        </>
      )}

      {/* ── Holdings tab ──────────────────────────────────────────────────────── */}
      {activeTab === "holdings" && (
        <>
          <div className="analysis-grid" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-title">
                <div className="icon">▤</div>
                Top Underlying Stocks
                <span style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 400, marginLeft: 4 }}>
                  (effective portfolio weight)
                </span>
              </div>
              <TopStocksBarChart data={analysis.topStocks} />
              <p style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 8 }}>
                Red bars = stock appears in multiple funds (hidden double exposure)
              </p>
            </div>

            <div className="card">
              <div className="card-title">
                <div className="icon">▤</div>
                Top Holdings Detail
              </div>
              <table className="stocks-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}>#</th>
                    <th>Stock</th>
                    <th>Sector</th>
                    <th style={{ textAlign: "right" }}>Weight</th>
                    <th>Funds</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.topStocks.slice(0, 12).map((stock, i) => (
                    <tr key={stock.ticker}>
                      <td style={{ color: "var(--gray-400)", fontSize: 11 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--gray-800)" }}>{stock.name}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{stock.ticker}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{stock.sector}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: stock.totalWeight > 3 ? "var(--red-600)" : "var(--gray-800)" }}>
                          {stock.totalWeight.toFixed(2)}%
                        </div>
                        <div className="stock-bar-cell" style={{ width: 60, marginLeft: "auto" }}>
                          <div className="stock-bar-bg">
                            <div
                              className="stock-bar-fill"
                              style={{
                                width: `${Math.min(100, (stock.totalWeight / (analysis.topStocks[0]?.totalWeight || 1)) * 100)}%`,
                                background: stock.totalWeight > 3 ? "#ef4444" : "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {stock.appearsIn.length > 1 && (
                          <span className="overlap-badge">{stock.appearsIn.length}×</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Overlap tab ───────────────────────────────────────────────────────── */}
      {activeTab === "overlap" && (
        <div className="card">
          <div className="card-title">
            <div className="icon">⊞</div>
            Fund Overlap Matrix
            <span style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 400, marginLeft: 4 }}>
              (shared underlying holdings %)
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 20 }}>
            Higher values mean the two funds hold more of the same stocks — reducing true diversification when held together.
          </p>
          <OverlapHeatmap matrix={analysis.overlapMatrix} fundNames={fundNames} />

          {/* Overlap detail */}
          <hr className="divider" />
          <div className="section-label">Top overlapping positions (stocks shared between funds)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {analysis.topStocks
              .filter((s) => s.appearsIn.length > 1)
              .map((stock) => (
                <div
                  key={stock.ticker}
                  style={{
                    background: "var(--red-50)",
                    border: "1px solid var(--red-100)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    minWidth: 160,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                    {stock.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                    {stock.totalWeight.toFixed(2)}% effective — in {stock.appearsIn.length} funds
                  </div>
                  {stock.appearsIn.map((f, i) => (
                    <div key={i} style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 1 }}>
                      {f.fundName}: {f.weight.toFixed(1)}% ({f.effectiveWeight.toFixed(2)}% net)
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
