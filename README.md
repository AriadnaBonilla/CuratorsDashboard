# Curators Dashboard 2.0

Interactive executive dashboard prototype for the Curators team. Runs entirely in the browser — no installation required.

---

## Quick Start

Open Terminal in this folder and run:

```bash
python3 server.py
```

The dashboard opens automatically at **http://localhost:3000**

> If port 3000 is taken: `python3 server.py 3001`

---

## How to Load Your Real Data

### Step 1 — Prepare your Requests CSV

Export your SharePoint / MS List data as CSV. The dashboard auto-detects columns by matching these aliases:

| Dashboard Field | Accepted Column Names |
|---|---|
| Request ID | `Request ID`, `RequestID`, `ID`, `LIST_ID`, `Item ID` |
| Campaign ID | `Campaign ID`, `CampaignID`, `CAMP_ID`, `Campaign Number` |
| Campaign Name | `Campaign Name`, `Title`, `Name` |
| Requester | `Requester`, `Requested By`, `Created By`, `AUTHOR` |
| Requester Role | `Requester Role`, `Role`, `Requestor Role` |
| Region | `Region`, `GEO`, `Geography` |
| MU | `MU`, `Market Unit`, `Sub-Region` |
| Industry | `Industry`, `Vertical`, `INDUSTRY` |
| LoB | `LoB`, `Line of Business`, `LOB` |
| Solution Area | `Solution Area`, `Solution`, `Product Area` |
| Campaign Type | `Campaign Type`, `Type`, `Tactic Type` |
| Asset Type | `Asset Type`, `DAT Type`, `Deliverable Type` |
| Status | `Status`, `STATE`, `Request Status` |
| Assigned To | `Assigned To`, `Owner`, `Curator`, `DAT Owner` |
| Submitted Date | `Submitted Date`, `Created`, `Created Date`, `Date Submitted` |
| Completed Date | `Completed Date`, `Completion Date`, `Closed Date` |
| Due Date | `Due Date`, `Deadline`, `Target Date` |
| DAT Supported Needed | `DAT Supported Needed`, `Asset Link`, `Link`, `Deliverable Link` |
| Influenced Pipeline | `Influenced Pipeline`, `Influenced Pipe`, `Influenced $` |
| Sourced Pipeline | `Sourced Pipeline`, `Sourced Pipe`, `Sourced $` |
| Accounts Touched | `Accounts Touched`, `Accounts`, `Account Count` |

See `data/sample/sample_requests.csv` for a working example.

### Step 2 — Upload via the sidebar

Click **Upload Requests CSV** in the sidebar. The dashboard reloads with your data automatically.

### Step 3 — Optionally upload Pipeline data

Export your SAP CRM pipeline data and click **Upload Pipeline CSV**. Accepted columns:

| Dashboard Field | Accepted Column Names |
|---|---|
| Request ID | `Request ID`, `RequestID`, `LIST_ID` |
| Campaign ID | `Campaign ID`, `CampaignID` |
| Opportunity ID | `Opportunity ID`, `Opp ID`, `OPPORTUNITY_ID` |
| Account Name | `Account Name`, `Account`, `Company` |
| Amount | `Amount`, `Pipeline Amount`, `Value`, `Opportunity Value` |
| Type | `Type`, `Pipeline Type` → must be `Influenced` or `Sourced` |
| Stage | `Stage`, `Opp Stage`, `Sales Stage` |
| Close Date | `Close Date`, `Expected Close` |

See `data/sample/sample_pipeline.csv` for a working example.

---

## Business Rules Implemented

| Rule | Implementation |
|---|---|
| One request = one campaign | Request ID is the primary unique key everywhere |
| Campaign completion | A campaign is "Completed" when `DAT Supported Needed` contains a valid `http...` link |
| Overdue logic | Calculated from `Due Date` — only shown when due date field exists in data |
| No SLA | No SLA compliance metric; delivery time analytics shown instead |
| Satisfaction | Placeholder only — not calculated (data doesn't exist yet) |
| Meetings created | Placeholder only — not calculated |
| Engagement generated | Placeholder only — not calculated |

---

## Configuring Team Capacity

To enable utilization % and capacity risk indicators in **Demand vs Capacity**, open `src/app.js` and edit `CAPACITY_MAP`:

```javascript
const CAPACITY_MAP = {
  "Sarah Chen": 15,       // max requests per quarter
  "Marcus Johnson": 12,
  // ... add all team members
};
```

---

## Dashboard Sections

| # | Section | Description |
|---|---|---|
| 1 | Overview | KPI cards, monthly/quarterly volume, status mix |
| 2 | Requests | Volume trends, backlog, aging, completion rate |
| 3 | Asset Mix | Asset type distribution by count, region, solution area |
| 4 | How We Are Used | Adoption by region, role, campaign type, solution, industry, LoB |
| 5 | Team Impact | Per-member workload, delivery time, pipeline contribution |
| 6 | Industry & LoB | Coverage heatmaps (Industry × LoB, Industry × Solution Area) |
| 7 | Pipeline Impact | Influenced/sourced pipeline by every dimension |
| 8 | Demand vs Capacity | Workload trends, open requests, capacity utilization |
| 9 | Campaign Detail | Searchable/sortable table with click-to-drilldown |
| 10 | Data Quality | Auto-detected issues: duplicate IDs, missing fields, broken links |

---

## Filters Available

All filters are applied globally and update all charts simultaneously:

- Period (All Time, YTD, Current Quarter, Previous Quarter, Last 12 Months, Custom)
- Region / MU
- Requester Role
- Campaign Type
- Solution Area
- Industry
- LoB
- Asset Type
- Status
- Team Member
- Search (free-text across all fields)

---

## Architecture

```
Dashboard 2.0/
├── index.html                  Entry point
├── server.py                   Local dev server
├── src/
│   ├── app.js                  Main orchestrator: routing, state, filter wiring
│   ├── styles/app.css          Custom CSS (Tailwind handles utilities)
│   ├── utils/
│   │   ├── store.js            Observable state store
│   │   └── formatters.js       Number/date formatters + date preset logic
│   ├── data/
│   │   ├── mockData.js         Mock data generator (120 requests)
│   │   ├── csvParser.js        CSV field mapping + normalization
│   │   └── transformations.js  All KPI + chart computations
│   ├── components/
│   │   ├── charts.js           Chart.js wrappers (bar, line, doughnut)
│   │   └── uiComponents.js     KPI cards, DataTable, badges, drilldown panel
│   └── pages/
│       ├── overview.js
│       ├── requests.js
│       ├── assetMix.js
│       ├── adoption.js
│       ├── teamImpact.js
│       ├── coverage.js
│       ├── pipelineImpact.js
│       ├── demandCapacity.js
│       ├── campaignDetail.js
│       └── dataQuality.js
└── data/
    └── sample/
        ├── sample_requests.csv
        └── sample_pipeline.csv
```

**Key design decisions:**
- All taxonomy values (industries, regions, LoBs, etc.) are discovered dynamically from the data — nothing is hardcoded in page components
- `transformations.js` contains all business logic — pages only call compute functions and render
- `csvParser.js` normalizes status values and asset type names before they reach the app
- Campaign completion is determined by the presence of a valid link in `datSupportedNeededLink`, not just the Status field

---

## Replacing Mock Data Permanently

To pre-load real data without uploading every time, place your CSV files at:

```
data/requests.csv
data/pipeline.csv
```

Then edit `src/app.js` to load them on startup via `fetch`:

```javascript
// In src/app.js, replace the mock data initialization with:
const response = await fetch('data/requests.csv');
const text = await response.text();
const { rows } = parseRequestsCSV(text);
store.setState({ allRequests: rows, dataSource: 'csv' });
```

---

## Future Placeholders

The following metrics are ready to be wired in once data becomes available:
- **Customer Satisfaction Score** — add field to requests CSV
- **Meetings Created** — add field to requests CSV  
- **Engagement Generated** — add field to requests CSV

---

*Built with Chart.js, PapaParse, and Tailwind CSS via CDN. No build step required.*
