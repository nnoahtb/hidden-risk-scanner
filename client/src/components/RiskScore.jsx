import React from "react";

const COLOR_MAP = {
  Low:       { stroke: "#22c55e", text: "#16a34a", bg: "#f0fdf4" },
  Moderate:  { stroke: "#f59e0b", text: "#d97706", bg: "#fffbeb" },
  High:      { stroke: "#ef4444", text: "#dc2626", bg: "#fef2f2" },
  "Very High":{ stroke: "#ef4444", text: "#dc2626", bg: "#fef2f2" },
};

const SUB_LABELS = {
  sectorConcentration: "Sector",
  regionConcentration: "Region",
  stockConcentration:  "Stock",
  fundOverlap:         "Overlap",
};

function Gauge({ score, color }) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const pct = score / 100;
  const dash = pct * circumference;

  return (
    <div className="risk-gauge">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* track */}
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        {/* fill */}
        <circle
          cx="40" cy="40" r={r}
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="risk-gauge-label">
        <span className="score" style={{ color: color.text }}>{score}</span>
        <span className="max">/100</span>
      </div>
    </div>
  );
}

export default function RiskScore({ scores }) {
  const color = COLOR_MAP[scores.label] || COLOR_MAP["Moderate"];

  const descriptions = {
    Low:        "Your portfolio appears reasonably diversified.",
    Moderate:   "Some concentration risks are present — review the details below.",
    High:       "Significant hidden concentration detected. Action recommended.",
    "Very High":"Critical concentration risk. Major hidden overlap found.",
  };

  return (
    <div className="risk-score-card">
      <Gauge score={scores.overall} color={color} />

      <div className="risk-score-meta">
        <h2 style={{ color: color.text }}>
          {scores.label} Risk
          <span style={{
            marginLeft: 10,
            fontSize: 12,
            fontWeight: 500,
            background: color.bg,
            color: color.text,
            padding: "2px 8px",
            borderRadius: 99,
            border: `1px solid ${color.stroke}22`,
          }}>
            Score {scores.overall}
          </span>
        </h2>
        <p>{descriptions[scores.label]}</p>
      </div>

      <div className="risk-sub-scores">
        {Object.entries(SUB_LABELS).map(([key, label]) => (
          <div className="sub-score" key={key}>
            <div className="label">{label}</div>
            <div className="value" style={{ color: scoreColor(scores[key]) }}>{scores[key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreColor(v) {
  if (v < 30) return "#22c55e";
  if (v < 55) return "#f59e0b";
  return "#ef4444";
}
