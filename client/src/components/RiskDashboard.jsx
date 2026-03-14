import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import InsightCards from "./InsightCards";
import RiskWarnings from "./RiskWarnings";
import { generateInsights } from "../utils/generateInsights";
import { generateWarningsAndSuggestions } from "../utils/generateWarningsAndSuggestions";

// ── Color palettes ────────────────────────────────────────────────────────────
const SECTOR_COLORS  = ["#1d4ed8","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#65a30d","#9ca3af"];
const COUNTRY_COLORS = ["#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#dbeafe","#eff6ff"];

// ── Hidden Risk Score config (1–10) ───────────────────────────────────────────
function scoreConfig(score) {
  if (score <= 3) return { label: "Low Risk",    color: "#16a34a", bg: "#f0fdf4", track: "#dcfce7", border: "#bbf7d0" };
  if (score <= 6) return { label: "Medium Risk", color: "#d97706", bg: "#fffbeb", track: "#fef3c7", border: "#fde68a" };
  return           { label: "High Risk",   color: "#dc2626", bg: "#fef2f2", track: "#fee2e2", border: "#fecaca" };
}

// ── Custom pie label ──────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ── Shared tooltip style ──────────────────────────────────────────────────────
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" };

// ─────────────────────────────────────────────────────────────────────────────
// Hidden Risk Score indicator
// ─────────────────────────────────────────────────────────────────────────────
function HiddenRiskScore({ score }) {
  const cfg = scoreConfig(score);
  const pct = ((score - 1) / 9) * 100; // map 1-10 → 0-100%

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 14,
      padding: "24px 28px",
      display: "flex",
      alignItems: "center",
      gap: 28,
      marginBottom: 24,
    }}>
      {/* Dial */}
      <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r="38" fill="none" stroke={cfg.track} strokeWidth="10" />
          <circle
            cx="48" cy="48" r="38"
            fill="none"
            stroke={cfg.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>/ 10</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: 18, fontWeight: 700, color: cfg.color,
          }}>
            {cfg.label}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600,
            background: cfg.color + "18",
            color: cfg.color,
            border: `1px solid ${cfg.color}33`,
            borderRadius: 99, padding: "2px 10px",
          }}>
            Hidden Risk Score
          </span>
        </div>

        {/* Bar track */}
        <div style={{ background: cfg.track, borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 8, maxWidth: 320 }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: cfg.color,
            borderRadius: 99,
            transition: "width 0.5s ease",
          }} />
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
          { label: "Low",    range: "1–3", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Medium", range: "4–6", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          { label: "High",   range: "7–10",color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
        ].map(({ label, range, color, bg, border }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: 12, fontWeight: 600,
            color,
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 99, padding: "3px 10px",
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
// Sector Pie Chart
// ─────────────────────────────────────────────────────────────────────────────
function SectorPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          labelLine={false}
          label={PieLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v.toFixed(1)}%`, "Exposure"]}
          contentStyle={tooltipStyle}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Country / Region Pie Chart
// ─────────────────────────────────────────────────────────────────────────────
function CountryPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={100}
          labelLine={false}
          label={PieLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v.toFixed(1)}%`, "Exposure"]}
          contentStyle={tooltipStyle}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top Companies Bar Chart
// ─────────────────────────────────────────────────────────────────────────────
function CompaniesBar({ data }) {
  // Recharts bar color: red if appears in multiple funds, blue otherwise
  const enriched = data.map((d) => ({
    ...d,
    fill: d.fundCount > 1 ? "#ef4444" : "#3b82f6",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={enriched}
        margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
        <XAxis
          type="number"
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{ fontSize: 12, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v, _, props) => {
            const d = props.payload;
            const suffix = d.fundCount > 1 ? ` — in ${d.fundCount} funds` : "";
            return [`${v}%${suffix}`, "Effective weight"];
          }}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="effectiveWeight" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {enriched.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Card({ title, icon, note, children }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: "22px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,.08)",
    }}>
      <div style={{
        fontSize: 14, fontWeight: 600, color: "#374151",
        marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 22, height: 22,
          background: "#eff6ff",
          borderRadius: 5,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 12,
        }}>{icon}</span>
        {title}
        {note && (
          <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
            {note}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RiskDashboard — main export
//
// Props:
//   result  — output of analyzePortfolio():
//             { topCompanies, sectorExposure, countryExposure, concentrationScore,
//               matchedFunds, unknownFunds }
//   onBack  — callback to go back to the input form
// ─────────────────────────────────────────────────────────────────────────────
export default function RiskDashboard({ result, onBack }) {
  const { topCompanies, sectorExposure, countryExposure, concentrationScore, matchedFunds, unknownFunds } = result;
  const insights = generateInsights({ topCompanies, sectorExposure, countryExposure, concentrationScore });
  const { warnings, suggestions } = generateWarningsAndSuggestions({ topCompanies, sectorExposure, countryExposure, concentrationScore });

  return (
    <div>
      {/* Page header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
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
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 6,
            border: "1px solid #d1d5db", background: "transparent",
            fontSize: 13, fontWeight: 600, color: "#4b5563",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Edit portfolio
        </button>
      </div>

      {/* Hidden Risk Score */}
      <HiddenRiskScore score={concentrationScore} />

      {/* Warnings & Suggestions */}
      <RiskWarnings warnings={warnings} suggestions={suggestions} />

      {/* Insights */}
      <InsightCards insights={insights} />

      {/* Charts — top row: sector + country */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card title="Sector Exposure" icon="◑">
          <SectorPie data={sectorExposure} />
        </Card>
        <Card title="Country / Region Exposure" icon="◑">
          <CountryPie data={countryExposure} />
        </Card>
      </div>

      {/* Charts — bottom: companies bar */}
      <Card
        title="Top 10 Company Exposure"
        icon="▤"
        note="(effective portfolio weight)"
      >
        <CompaniesBar data={topCompanies} />
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          Red bars = stock appears in more than one fund (hidden double-exposure)
        </p>
      </Card>
    </div>
  );
}
