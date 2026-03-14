# Hidden Risk Scanner

A portfolio analysis tool that reveals hidden concentration risks across your funds. Enter your funds and allocation percentages to see overlapping stock holdings, sector and geographic exposure, and plain-language warnings about what could hurt your portfolio.

![Hidden Risk Scanner Dashboard](https://raw.githubusercontent.com/nnoahtb/hidden-risk-scanner/master/screenshot.png)

---

## What it does

Most investors hold several funds believing they are diversified. In reality, many funds hold the same underlying stocks — especially US mega-cap tech companies like Apple, Microsoft, and Nvidia. Hidden Risk Scanner shows you:

- **How much of your portfolio is actually in each company**, even when held indirectly through funds
- **Which stocks appear in multiple funds**, inflating your real exposure
- **Sector and geographic concentration** — e.g. "72% of your portfolio is in North America"
- **Scenario estimates** — e.g. "If Nvidia drops 30%, your portfolio may drop about 4.2%"
- **Actionable suggestions** to improve diversification

---

## Features

- Portfolio input with multi-fund allocation and 100% validation
- Fund holdings database covering 6 Swedish and global funds
- Client-side risk analysis — no data leaves your browser
- Hidden Risk Score from 1 (well diversified) to 10 (highly concentrated)
- Risk warnings with estimated portfolio impact per scenario
- Diversification suggestions tailored to your portfolio
- Sector exposure pie chart
- Country / region exposure donut chart
- Top 10 company exposure bar chart (red = appears in multiple funds)

---

## Supported funds

| Fund | Type |
|---|---|
| Avanza Global | Global Index |
| Spiltan Aktiefond Investmentbolag | Swedish Equities |
| Swedbank Robur Technology | Sector – Technology |
| Länsförsäkringar Global Indexnära | Global Index |
| DNB Global Indeks | Global Index |
| Handelsbanken Hälsovård Tema | Sector – Healthcare |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm

### Install

```bash
git clone https://github.com/nnoahtb/hidden-risk-scanner.git
cd hidden-risk-scanner
npm run install:all
```

### Run

```bash
npm run dev
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:4000 |

---

## Project structure

```
hidden-risk-scanner/
├── client/                          # React frontend
│   └── src/
│       ├── components/
│       │   ├── PortfolioInput.jsx   # Fund entry form
│       │   ├── RiskDashboard.jsx    # Main dashboard page
│       │   ├── RiskWarnings.jsx     # Warnings & suggestions panel
│       │   ├── InsightCards.jsx     # Plain-language insight cards
│       │   └── RiskCharts.jsx       # Recharts pie and bar charts
│       ├── utils/
│       │   ├── analyzePortfolio.js              # Core exposure calculator
│       │   ├── generateWarningsAndSuggestions.js # Warning + impact generator
│       │   └── generateInsights.js              # Insight card generator
│       └── data/
│           └── fundDatabase.js      # Client-side fund holdings
│
└── server/                          # Express API (optional backend)
    └── src/
        ├── data/fundData.js         # Server-side fund holdings
        ├── services/riskAnalyzer.js # Server-side analysis
        └── routes/portfolio.js      # POST /api/analyze
```

---

## How the risk score is calculated

The Hidden Risk Score (1–10) is based on four signals:

| Signal | Weight |
|---|---|
| Largest single stock position | 30% |
| Largest sector concentration | 30% |
| Largest regional concentration | 20% |
| Top 5 stocks combined weight | 20% |

Each signal is scaled against typical portfolio thresholds and combined into a final score.

---

## Disclaimer

Fund holdings data is approximate and illustrative. It is based on publicly available information and is not updated in real time. This tool is for educational purposes only and does not constitute financial advice.
