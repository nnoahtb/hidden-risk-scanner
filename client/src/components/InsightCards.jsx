import React, { useState } from "react";

// ── Level config ──────────────────────────────────────────────────────────────
const LEVEL = {
  danger: {
    border: "#fca5a5",
    bg:     "#fef2f2",
    icon:   "#dc2626",
    badge:  { bg: "#fee2e2", text: "#dc2626" },
    label:  "High Risk",
    symbol: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  warning: {
    border: "#fcd34d",
    bg:     "#fffbeb",
    icon:   "#d97706",
    badge:  { bg: "#fef3c7", text: "#d97706" },
    label:  "Watch Out",
    symbol: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  info: {
    border: "#93c5fd",
    bg:     "#eff6ff",
    icon:   "#2563eb",
    badge:  { bg: "#dbeafe", text: "#1d4ed8" },
    label:  "Note",
    symbol: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
  },
  positive: {
    border: "#86efac",
    bg:     "#f0fdf4",
    icon:   "#16a34a",
    badge:  { bg: "#dcfce7", text: "#16a34a" },
    label:  "Good",
    symbol: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
};

// ── Category label ────────────────────────────────────────────────────────────
const CATEGORY_LABEL = {
  sector:          "Sector",
  region:          "Geography",
  company:         "Stock",
  overlap:         "Overlap",
  diversification: "Diversification",
};

// ── Single card ───────────────────────────────────────────────────────────────
function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEVEL[insight.level] ?? LEVEL.info;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      transition: "box-shadow 0.15s",
    }}>
      {/* Icon */}
      <div style={{
        color: cfg.icon,
        flexShrink: 0,
        marginTop: 1,
        width: 20,
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {cfg.symbol}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
            background: cfg.badge.bg, color: cfg.badge.text,
            borderRadius: 99, padding: "2px 8px",
          }}>
            {cfg.label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px",
            background: "rgba(0,0,0,0.05)", color: "#6b7280",
            borderRadius: 99, padding: "2px 8px",
          }}>
            {CATEGORY_LABEL[insight.category] ?? insight.category}
          </span>
        </div>

        {/* Headline */}
        <p style={{
          fontSize: 14, fontWeight: 600, color: "#111827",
          lineHeight: 1.45, margin: 0,
        }}>
          {insight.headline}
        </p>

        {/* Detail — toggle */}
        {insight.detail && (
          <>
            {expanded && (
              <p style={{
                fontSize: 13, color: "#4b5563", lineHeight: 1.55,
                marginTop: 8, marginBottom: 0,
              }}>
                {insight.detail}
              </p>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: cfg.icon, fontWeight: 600,
                padding: 0, marginTop: 6, display: "inline-flex",
                alignItems: "center", gap: 4, fontFamily: "inherit",
              }}
            >
              {expanded ? "Show less" : "Why does this matter?"}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all",            label: "All" },
  { key: "danger",        label: "High Risk" },
  { key: "warning",       label: "Warnings" },
  { key: "info",          label: "Notes" },
  { key: "positive",      label: "Positives" },
];

// ── InsightCards — main export ────────────────────────────────────────────────
export default function InsightCards({ insights }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? insights
    : insights.filter((i) => i.level === activeFilter);

  // Count per level for badges
  const counts = insights.reduce((acc, i) => {
    acc[i.level] = (acc[i.level] ?? 0) + 1;
    return acc;
  }, {});

  if (insights.length === 0) return null;

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 22, height: 22,
            background: "#eff6ff",
            borderRadius: 5,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 12,
          }}>💡</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            Portfolio Insights
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: "#f3f4f6", color: "#6b7280",
            borderRadius: 99, padding: "2px 8px",
          }}>
            {insights.length} finding{insights.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {FILTERS.map(({ key, label }) => {
            const count = key === "all" ? insights.length : (counts[key] ?? 0);
            if (key !== "all" && count === 0) return null;
            const active = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{
                  background: active ? "#1d4ed8" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  border: `1px solid ${active ? "#1d4ed8" : "#e5e7eb"}`,
                  borderRadius: 99,
                  padding: "4px 12px",
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  transition: "all 0.15s",
                }}
              >
                {label}
                <span style={{
                  background: active ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                  color: active ? "#fff" : "#9ca3af",
                  borderRadius: 99,
                  padding: "0 5px",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {filtered.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
          No insights in this category.
        </p>
      )}
    </div>
  );
}
