import React, { useState, useMemo, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import InsightCards from "./InsightCards";
import RiskWarnings from "./RiskWarnings";
import { generateInsights } from "../utils/generateInsights";
import { generateWarningsAndSuggestions } from "../utils/generateWarningsAndSuggestions";
import { analyzePortfolio } from "../utils/analyzePortfolio";
import FUND_DATABASE from "../data/fundDatabase";

// ── Color palettes ────────────────────────────────────────────────────────────
const SECTOR_COLORS  = ["#1d4ed8","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#65a30d","#9ca3af"];
const COUNTRY_COLORS = ["#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#dbeafe","#eff6ff"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" };

let nextId = 100;

function scoreConfig(score) {
  if (score <= 3) return { label: "Low Risk",    color: "#16a34a", bg: "#f0fdf4", track: "#dcfce7", border: "#bbf7d0" };
  if (score <= 6) return { label: "Medium Risk", color: "#d97706", bg: "#fffbeb", track: "#fef3c7", border: "#fde68a" };
  return           { label: "High Risk",   color: "#dc2626", bg: "#fef2f2", track: "#fee2e2", border: "#fecaca" };
}

// ── Custom pie label ──────────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hidden Risk Score
// ─────────────────────────────────────────────────────────────────────────────
function HiddenRiskScore({ score, originalScore }) {
  const cfg  = scoreConfig(score);
  const pct  = ((score - 1) / 9) * 100;
  const delta = score - originalScore;

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 14, padding: "24px 28px",
      display: "flex", alignItems: "center", gap: 28, marginBottom: 24,
    }}>
      {/* Dial */}
      <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r="38" fill="none" stroke={cfg.track} strokeWidth="10" />
          <circle cx="48" cy="48" r="38" fill="none" stroke={cfg.color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
            style={{ transition: "stroke-dasharray 0.4s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>/ 10</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, background: cfg.color + "18", color: cfg.color,
            border: `1px solid ${cfg.color}33`, borderRadius: 99, padding: "2px 10px" }}>
            Hidden Risk Score
          </span>
          {/* Delta badge */}
          {delta !== 0 && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              background: delta > 0 ? "#fee2e2" : "#dcfce7",
              color:      delta > 0 ? "#dc2626" : "#16a34a",
              border:     `1px solid ${delta > 0 ? "#fca5a5" : "#86efac"}`,
              borderRadius: 99, padding: "2px 10px",
              display: "inline-flex", alignItems: "center", gap: 3,
            }}>
              {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} from original
            </span>
          )}
        </div>
        <div style={{ background: cfg.track, borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 8, maxWidth: 320 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
          {score <= 3 && "Your portfolio shows good diversification with minimal hidden overlap."}
          {score > 3 && score <= 6 && "Moderate concentration detected — some stocks or sectors appear across multiple funds."}
          {score > 6 && "High concentration risk. Significant hidden overlap and sector/region concentration found."}
        </p>
      </div>

      {/* Legend pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {[
          { label: "Low",    range: "1–3",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Medium", range: "4–6",  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          { label: "High",   range: "7–10", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
        ].map(({ label, range, color, bg, border }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600,
            color, background: bg, border: `1px solid ${border}`, borderRadius: 99, padding: "3px 10px",
            opacity: cfg.label.startsWith(label) ? 1 : 0.4,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {label} <span style={{ fontWeight: 400, color: "#9ca3af" }}>{range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Simulator
// ─────────────────────────────────────────────────────────────────────────────
function PortfolioSimulator({ rows, onChange }) {
  const [query, setQuery]     = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const inputRef = useRef(null);

  const total     = rows.reduce((s, r) => s + (parseFloat(r.allocation) || 0), 0);
  const totalValid = Math.abs(total - 100) < 0.01;
  const barColor  = total > 100 ? "#dc2626" : totalValid ? "#16a34a" : "#3b82f6";

  // Fund autocomplete list
  const suggestions = query.trim().length > 0
    ? Object.entries(FUND_DATABASE)
        .filter(([, f]) => f.displayName.toLowerCase().includes(query.toLowerCase()))
        .filter(([key]) => !rows.some((r) => r.name.toLowerCase() === FUND_DATABASE[key]?.displayName.toLowerCase()))
        .slice(0, 6)
    : [];

  function updateAllocation(id, value) {
    onChange(rows.map((r) => r.id === id ? { ...r, allocation: value } : r));
  }

  function removeRow(id) {
    onChange(rows.filter((r) => r.id !== id));
  }

  function addFund(displayName) {
    onChange([...rows, { id: nextId++, name: displayName, allocation: "" }]);
    setQuery("");
    setShowDrop(false);
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 14, padding: "20px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ width: 22, height: 22, background: "#f0fdf4", borderRadius: 5,
          display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
          ⚡
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Simulate Portfolio Changes</span>
        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>— edit allocations and watch the dashboard update live</span>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 40px", gap: 8, marginBottom: 6, padding: "0 4px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px" }}>Fund</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px", textAlign: "right" }}>Allocation %</span>
        <span />
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {rows.map((row) => {
          const val     = parseFloat(row.allocation) || 0;
          const effPct  = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
          const showEff = total > 0 && Math.abs(total - 100) > 0.5;

          return (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 40px", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827",
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 6, padding: "8px 12px",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
                {showEff && (
                  <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8, flexShrink: 0 }}>→ {effPct}%</span>
                )}
              </div>
              <input
                type="number"
                value={row.allocation}
                onChange={(e) => updateAllocation(row.id, e.target.value)}
                placeholder="0"
                min="0" max="100" step="1"
                style={{
                  width: "100%", padding: "8px 12px",
                  border: "1px solid #e5e7eb", borderRadius: 6,
                  fontSize: 14, fontWeight: 600, textAlign: "right",
                  fontFamily: "inherit", color: "#111827", outline: "none",
                  background: "#fff",
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e)  => e.target.style.borderColor = "#e5e7eb"}
              />
              <button
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                style={{
                  width: 36, height: 36, border: "none", background: "transparent",
                  cursor: rows.length === 1 ? "not-allowed" : "pointer",
                  color: "#9ca3af", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (rows.length > 1) e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add fund autocomplete */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0,
          border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff",
          overflow: "hidden",
          outline: showDrop ? "2px solid #3b82f6" : "none", outlineOffset: -1,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
            style={{ marginLeft: 12, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="Search and add a fund..."
            style={{
              flex: 1, padding: "9px 12px", border: "none", outline: "none",
              fontSize: 13, fontFamily: "inherit", color: "#111827", background: "transparent",
            }}
          />
        </div>

        {showDrop && suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,.12)", zIndex: 50, overflow: "hidden",
          }}>
            {suggestions.map(([key, fund]) => (
              <button
                key={key}
                onMouseDown={() => addFund(fund.displayName)}
                style={{
                  width: "100%", padding: "10px 14px", border: "none",
                  background: "transparent", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fund.displayName}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{fund.type}</div>
                </div>
                {fund.ter != null && (
                  <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0, marginLeft: 12 }}>
                    TER {fund.ter}%
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Allocation total bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
          <span>Total allocation</span>
          <span style={{ fontWeight: 700, color: barColor }}>
            {total.toFixed(1)}% {totalValid ? "✓" : ""}
          </span>
        </div>
        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99, background: barColor,
            width: `${Math.min(total, 100)}%`, transition: "width 0.3s, background 0.3s",
          }} />
        </div>
        {!totalValid && total > 0 && (
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>
            {total > 100
              ? `Over by ${(total - 100).toFixed(1)}% — charts show normalized weights`
              : `${(100 - total).toFixed(1)}% remaining — charts show normalized weights`}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Charts
// ─────────────────────────────────────────────────────────────────────────────
function SectorPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          outerRadius={100} labelLine={false} label={PieLabel}>
          {data.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, "Exposure"]} contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CountryPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={55} outerRadius={100} labelLine={false} label={PieLabel}>
          {data.map((_, i) => <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, "Exposure"]} contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CompaniesBar({ data }) {
  const enriched = data.map((d) => ({ ...d, fill: d.fundCount > 1 ? "#ef4444" : "#3b82f6" }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={enriched} margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
        <XAxis type="number" tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={88}
          tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v, _, props) => {
            const d = props.payload;
            const suffix = d.fundCount > 1 ? ` — in ${d.fundCount} funds` : "";
            return [`${v}%${suffix}`, "Effective weight"];
          }}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="effectiveWeight" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {enriched.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Card({ title, icon, note, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
      padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#374151",
        marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 22, height: 22, background: "#eff6ff", borderRadius: 5,
          display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
          {icon}
        </span>
        {title}
        {note && <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>{note}</span>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RiskDashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function RiskDashboard({ initialPortfolio, onBack }) {
  const [rows, setRows] = useState(() =>
    initialPortfolio.map((p, i) => ({ id: i + 1, name: p.name, allocation: String(p.allocation) }))
  );

  // Store the original score once on first render
  const originalScore = useRef(
    analyzePortfolio(initialPortfolio, FUND_DATABASE).concentrationScore
  ).current;

  // Live result — recomputes whenever rows change
  const result = useMemo(() => {
    const portfolio = rows
      .map((r) => ({ name: r.name, allocation: parseFloat(r.allocation) || 0 }))
      .filter((r) => r.name.trim() && r.allocation > 0);
    if (portfolio.length === 0) return originalResult;
    return analyzePortfolio(portfolio, FUND_DATABASE);
  }, [rows, originalResult]);

  const { topCompanies, sectorExposure, countryExposure, concentrationScore, matchedFunds, unknownFunds } = result;
  const insights = generateInsights({ topCompanies, sectorExposure, countryExposure, concentrationScore });
  const { warnings, suggestions } = generateWarningsAndSuggestions({ topCompanies, sectorExposure, countryExposure, concentrationScore });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px" }}>
            Portfolio Risk Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            {matchedFunds.length} fund{matchedFunds.length !== 1 ? "s" : ""} analyzed
            {unknownFunds.length > 0 && (
              <span style={{ color: "#d97706", marginLeft: 8 }}>
                · {unknownFunds.length} not recognized: {unknownFunds.join(", ")}
              </span>
            )}
          </p>
        </div>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 6,
          border: "1px solid #d1d5db", background: "transparent",
          fontSize: 13, fontWeight: 600, color: "#4b5563", cursor: "pointer",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Edit portfolio
        </button>
      </div>

      {/* Hidden Risk Score */}
      <HiddenRiskScore score={concentrationScore} originalScore={originalScore} />

      {/* Live Simulator */}
      <PortfolioSimulator rows={rows} onChange={setRows} />

      {/* Warnings & Suggestions */}
      <RiskWarnings warnings={warnings} suggestions={suggestions} />

      {/* Insights */}
      <InsightCards insights={insights} />

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card title="Sector Exposure" icon="◑">
          <SectorPie data={sectorExposure} />
        </Card>
        <Card title="Country / Region Exposure" icon="◑">
          <CountryPie data={countryExposure} />
        </Card>
      </div>

      <Card title="Top 10 Company Exposure" icon="▤" note="(effective portfolio weight)">
        <CompaniesBar data={topCompanies} />
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          Red bars = stock appears in more than one fund (hidden double-exposure)
        </p>
      </Card>
    </div>
  );
}
