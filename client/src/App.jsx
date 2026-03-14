import React, { useState } from "react";
import PortfolioInput from "./components/PortfolioInput";
import RiskDashboard from "./components/RiskDashboard";
import { analyzePortfolio } from "./utils/analyzePortfolio";
import FUND_DATABASE from "./data/fundDatabase";

const EXAMPLE_PORTFOLIO = [
  { id: 1, name: "Avanza Global",       allocation: 40 },
  { id: 2, name: "Spiltan Aktiefond",   allocation: 30 },
  { id: 3, name: "Swedbank Robur Tech", allocation: 30 },
];

export default function App() {
  const [view, setView]       = useState("input");   // "input" | "dashboard"
  const [result, setResult]   = useState(null);

  function handleAnalyze(portfolio) {
    const analysis = analyzePortfolio(portfolio, FUND_DATABASE);
    setResult(analysis);
    setView("dashboard");
  }

  function handleBack() {
    setView("input");
    setResult(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        </div>
        <span className="header-title">Hidden Risk Scanner</span>
        <span className="header-subtitle">Portfolio concentration analysis</span>
      </header>

      <main className="main">
        {view === "input" && (
          <PortfolioInput
            defaultPortfolio={EXAMPLE_PORTFOLIO}
            onAnalyze={handleAnalyze}
          />
        )}

        {view === "dashboard" && result && (
          <RiskDashboard result={result} onBack={handleBack} />
        )}
      </main>
    </div>
  );
}
