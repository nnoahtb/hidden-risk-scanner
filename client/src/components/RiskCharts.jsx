import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BTooltip,
} from "recharts";

// ── Color palettes ───────────────────────────────────────────────────────────
const BLUE_PALETTE   = ["#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#dbeafe","#eff6ff"];
const SECTOR_PALETTE = ["#1d4ed8","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#65a30d","#9ca3af"];

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ── Sector breakdown pie ─────────────────────────────────────────────────────
export function SectorPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={95}
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SECTOR_PALETTE[i % SECTOR_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v.toFixed(1)}%`, "Effective weight"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Region breakdown pie ─────────────────────────────────────────────────────
export function RegionPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={95}
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={BLUE_PALETTE[i % BLUE_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v.toFixed(1)}%`, "Effective weight"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Top stocks bar chart ─────────────────────────────────────────────────────
export function TopStocksBarChart({ data }) {
  const top10 = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={top10}
        margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
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
          width={90}
          tick={{ fontSize: 12, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
        />
        <BTooltip
          formatter={(v, _, props) => {
            const d = props.payload;
            return [`${v}% effective weight (in ${d.appearsIn?.length ?? 1} fund${d.appearsIn?.length > 1 ? "s" : ""})`, d.name];
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Bar dataKey="totalWeight" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {top10.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.appearsIn?.length > 1 ? "#ef4444" : "#3b82f6"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Overlap heatmap (pure CSS grid) ─────────────────────────────────────────
export function OverlapHeatmap({ matrix, fundNames }) {
  if (!matrix || matrix.length === 0) return null;

  function cellColor(overlap, isSelf) {
    if (isSelf) return { bg: "#1d4ed8", text: "white" };
    if (overlap >= 15) return { bg: "#fee2e2", text: "#dc2626" };
    if (overlap >= 8)  return { bg: "#fef3c7", text: "#d97706" };
    if (overlap >= 3)  return { bg: "#dbeafe", text: "#2563eb" };
    return { bg: "#f9fafb", text: "#6b7280" };
  }

  const n = matrix.length;

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${n}, 1fr)`, gap: 3, marginBottom: 3 }}>
        <div />
        {fundNames.map((name, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "var(--gray-400)", textAlign: "center", padding: "0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shortName(name)}
          </div>
        ))}
      </div>

      {matrix.map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `120px repeat(${n}, 1fr)`, gap: 3, marginBottom: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--gray-500)", display: "flex", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shortName(fundNames[i])}
          </div>
          {row.map((cell, j) => {
            const isSelf = i === j;
            const colors = cellColor(cell.overlap, isSelf);
            return (
              <div
                key={j}
                title={`${cell.fundA} × ${cell.fundB}: ${isSelf ? "100%" : cell.overlap.toFixed(1) + "% overlap"}`}
                style={{
                  background: colors.bg,
                  color: colors.text,
                  height: 48,
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "default",
                }}
              >
                {isSelf ? "—" : `${cell.overlap.toFixed(1)}%`}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { color: "#fee2e2", textColor: "#dc2626", label: "High overlap ≥15%" },
          { color: "#fef3c7", textColor: "#d97706", label: "Medium ≥8%" },
          { color: "#dbeafe", textColor: "#2563eb", label: "Low ≥3%" },
          { color: "#f9fafb", textColor: "#6b7280", label: "Minimal <3%" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gray-500)" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: "1px solid #e5e7eb" }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortName(name) {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length <= 2) return name;
  return words.slice(0, 2).join(" ");
}
