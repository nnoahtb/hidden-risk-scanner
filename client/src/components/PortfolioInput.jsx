import React, { useState } from "react";

const SUPPORTED_FUNDS = [
  "Avanza Global",
  "Spiltan Aktiefond",
  "Swedbank Robur Tech",
  "Länsförsäkringar Global Indexnära",
  "DNB Global Indeks",
  "Handelsbanken Hälsovård Tema",
];

let nextId = 10;

export default function PortfolioInput({ defaultPortfolio, onAnalyze }) {
  const [rows, setRows] = useState(
    defaultPortfolio.map((r) => ({ ...r }))
  );

  const totalAlloc = rows.reduce((s, r) => s + (parseFloat(r.allocation) || 0), 0);
  const totalValid = Math.abs(totalAlloc - 100) < 0.01;
  const hasValidRows = rows.some((r) => r.name.trim()) && rows.every((r) => !r.name.trim() || parseFloat(r.allocation) > 0);
  const canAnalyze = hasValidRows && totalValid;

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextId++, name: "", allocation: "" }]);
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function quickFill(fundName) {
    // Find first empty name row, else add new
    const empty = rows.find((r) => !r.name.trim());
    if (empty) {
      updateRow(empty.id, "name", fundName);
    } else {
      setRows((prev) => [...prev, { id: nextId++, name: fundName, allocation: "" }]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const portfolio = rows
      .filter((r) => r.name.trim() && parseFloat(r.allocation) > 0)
      .map((r) => ({ name: r.name.trim(), allocation: parseFloat(r.allocation) }));
    if (portfolio.length === 0) return;
    onAnalyze(portfolio);
  }

  const barColor = totalAlloc > 100 ? "#ef4444" : totalAlloc === 100 ? "#22c55e" : "#3b82f6";
  const barWidth = Math.min(totalAlloc, 100);

  return (
    <form className="portfolio-input-page" onSubmit={handleSubmit}>
      <div className="input-form card">
        <div className="input-hero">
          <h1>Scan your portfolio for hidden risk</h1>
          <p>Enter your funds and allocation percentages. We'll reveal overlapping holdings and concentration risks you might not know about.</p>
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 36px", gap: 8, marginBottom: 8, padding: "0 0 0 0" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Fund / Stock</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.4px", textAlign: "right" }}>Weight %</span>
          <span />
        </div>

        <div className="fund-rows">
          {rows.map((row, idx) => (
            <div className="fund-row" key={row.id}>
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRow(row.id, "name", e.target.value)}
                placeholder={`Fund or stock ${idx + 1}`}
                autoComplete="off"
              />
              <input
                type="number"
                className="alloc-input"
                value={row.allocation}
                onChange={(e) => updateRow(row.id, "allocation", e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeRow(row.id)}
                title="Remove"
                disabled={rows.length === 1}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="input-actions">
          <button type="button" className="btn btn-outline" onClick={addRow} style={{ fontSize: 13, padding: "7px 14px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add row
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setRows(defaultPortfolio.map((r) => ({ ...r })))}>
            Reset to example
          </button>
        </div>

        {/* Allocation total bar */}
        <div className="allocation-total">
          <div className="alloc-label">
            <span>Total allocation</span>
            <span className="total-pct" style={{ color: barColor }}>
              {totalAlloc.toFixed(1)}% {totalValid ? "✓" : ""}
            </span>
          </div>
          <div className="alloc-bar-bg">
            <div
              className="alloc-bar-fill"
              style={{ width: `${barWidth}%`, background: barColor }}
            />
          </div>
          {!totalValid && totalAlloc > 0 && (
            <p style={{ fontSize: 12, color: totalAlloc > 100 ? "var(--red-500)" : "var(--gray-500)", marginTop: 5 }}>
              {totalAlloc > 100
                ? `Over by ${(totalAlloc - 100).toFixed(1)}% — reduce allocations to reach 100%.`
                : `${(100 - totalAlloc).toFixed(1)}% remaining — allocations must total exactly 100%.`}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canAnalyze} style={{ width: "100%", justifyContent: "center" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Analyze Portfolio
        </button>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="hint-card">
          <h3>What we detect</h3>
          <ul className="hint-list">
            <li><div className="hint-dot" />Hidden stock overlap between funds</li>
            <li><div className="hint-dot" />Sector concentration risk</li>
            <li><div className="hint-dot" />Geographic over-exposure</li>
            <li><div className="hint-dot" />Mega-cap dominance in "diversified" portfolios</li>
          </ul>

          <div className="supported-funds">
            <h4>Supported funds (click to add)</h4>
            <div>
              {SUPPORTED_FUNDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="fund-tag"
                  onClick={() => quickFill(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, fontSize: 12, color: "var(--gray-500)" }}>
          <strong style={{ color: "var(--gray-700)", display: "block", marginBottom: 6 }}>Example input</strong>
          <code style={{ display: "block", background: "var(--gray-50)", padding: 10, borderRadius: 6, lineHeight: 1.7, fontFamily: "monospace", fontSize: 12 }}>
            Avanza Global &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 40<br />
            Spiltan Aktiefond &nbsp;&nbsp;&nbsp; 30<br />
            Swedbank Robur Tech &nbsp; 30
          </code>
        </div>
      </div>
    </form>
  );
}
