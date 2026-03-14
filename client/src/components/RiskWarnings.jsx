import React, { useState } from "react";

// ── Risk level config ─────────────────────────────────────────────────────────
const RISK = {
  high: {
    bg:        "#fef2f2",
    border:    "#fca5a5",
    iconColor: "#dc2626",
    badge:     { bg: "#fee2e2", text: "#dc2626" },
    label:     "High Risk",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  medium: {
    bg:        "#fffbeb",
    border:    "#fcd34d",
    iconColor: "#d97706",
    badge:     { bg: "#fef3c7", text: "#d97706" },
    label:     "Medium Risk",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  low: {
    bg:        "#eff6ff",
    border:    "#93c5fd",
    iconColor: "#2563eb",
    badge:     { bg: "#dbeafe", text: "#1d4ed8" },
    label:     "Low Risk",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
  },
};

const SUGGESTION_STYLE = {
  bg:        "#f0fdf4",
  border:    "#86efac",
  iconColor: "#16a34a",
  badge:     { bg: "#dcfce7", text: "#15803d" },
  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

// ── Impact callout ────────────────────────────────────────────────────────────
function ImpactCallout({ impact, riskLevel }) {
  const color =
    riskLevel === "high"   ? { text: "#dc2626", bg: "#fff1f1", border: "#fca5a5" } :
    riskLevel === "medium" ? { text: "#b45309", bg: "#fffbeb", border: "#fcd34d" } :
                             { text: "#1d4ed8", bg: "#eff6ff", border: "#93c5fd" };

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      background: color.bg,
      border: `1px solid ${color.border}`,
      borderRadius: 8,
      padding: "8px 12px",
      marginTop: 10,
    }}>
      {/* Down arrow icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.text} strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 1 }}>
          Estimated portfolio impact
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: color.text, lineHeight: 1 }}>
            −{impact.estimatedDrop.toFixed(1)}%
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {impact.scenario}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Single card ───────────────────────────────────────────────────────────────
function Card({ title, description, riskLevel, impact, type }) {
  const style = type === "suggestion"
    ? SUGGESTION_STYLE
    : (RISK[riskLevel] ?? RISK.low);

  const badgeLabel = type === "suggestion"
    ? "Suggestion"
    : (RISK[riskLevel]?.label ?? "Note");

  const badgeStyle = type === "suggestion"
    ? SUGGESTION_STYLE.badge
    : (RISK[riskLevel]?.badge ?? RISK.low.badge);

  return (
    <div style={{
      background: style.bg,
      border:     `1px solid ${style.border}`,
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{ color: style.iconColor, flexShrink: 0, marginTop: 1 }}>
        {style.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
            background: badgeStyle.bg, color: badgeStyle.text,
            borderRadius: 99, padding: "2px 8px",
          }}>
            {badgeLabel}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px 0", lineHeight: 1.4 }}>
          {title}
        </p>
        <p style={{ fontSize: 13, color: "#4b5563", margin: 0, lineHeight: 1.55 }}>
          {description}
        </p>
        {impact && <ImpactCallout impact={impact} riskLevel={riskLevel} />}
      </div>
    </div>
  );
}

// ── RiskWarnings ──────────────────────────────────────────────────────────────
export default function RiskWarnings({ warnings, suggestions }) {
  const [tab, setTab] = useState("warnings");

  const tabs = [
    { key: "warnings",    label: "Risk Warnings",  count: warnings.length },
    { key: "suggestions", label: "Suggestions",    count: suggestions.length },
  ];

  const items     = tab === "warnings" ? warnings : suggestions;
  const itemType  = tab === "warnings" ? "warning" : "suggestion";

  // Sort warnings: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 };
  const sorted = tab === "warnings"
    ? [...items].sort((a, b) => (ORDER[a.riskLevel] ?? 3) - (ORDER[b.riskLevel] ?? 3))
    : items;

  // Count per risk level for the warning tab summary
  const highCount   = warnings.filter((w) => w.riskLevel === "high").length;
  const mediumCount = warnings.filter((w) => w.riskLevel === "medium").length;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: "22px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 22, height: 22, background: "#fef2f2",
              borderRadius: 5, display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>
              ⚠
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              Risk Warnings &amp; Suggestions
            </span>
          </div>
          {/* Summary pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {highCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, background: "#fee2e2", color: "#dc2626", borderRadius: 99, padding: "2px 9px" }}>
                {highCount} high risk
              </span>
            )}
            {mediumCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, background: "#fef3c7", color: "#d97706", borderRadius: 99, padding: "2px 9px" }}>
                {mediumCount} medium risk
              </span>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, background: "#dcfce7", color: "#15803d", borderRadius: 99, padding: "2px 9px" }}>
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 }}>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                background:   tab === key ? "#fff" : "transparent",
                color:        tab === key ? "#111827" : "#6b7280",
                border:       "none",
                borderRadius: 6,
                padding:      "6px 14px",
                fontSize:     13,
                fontWeight:   600,
                cursor:       "pointer",
                fontFamily:   "inherit",
                boxShadow:    tab === key ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                display:      "inline-flex",
                alignItems:   "center",
                gap:          6,
                transition:   "all 0.15s",
              }}
            >
              {label}
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: tab === key ? "#f3f4f6" : "transparent",
                color: tab === key ? "#374151" : "#9ca3af",
                borderRadius: 99, padding: "0 5px",
              }}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
          No {tab} to display.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((item, i) => (
            <Card
              key={i}
              title={item.title}
              description={item.description}
              riskLevel={item.riskLevel}
              impact={item.impact ?? null}
              type={itemType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
