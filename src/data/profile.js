// Canonical content — EXTRACTED from the live site + Vault and APPROVED by
// Sylvester (2026-06-01). Nothing here is invented.
//   - Radar axes: 7-axis union (approved)
//   - Mappings: 0–3 scale (approved as-is)
//   - Roster: SGN only (approved)
//   - Bio: extracted baseline (approved)

export const positioning =
  "IT professional building applied analytics, automation, and cloud capability through real projects.";

export const bio = {
  heroSummary:
    "I build analytics and automation pipelines that turn operational data into clearer decisions.",
  about: [
    "IT professional with enterprise service experience in global support environments. I enjoy turning complex operational data into insights and automating workflows that improve efficiency and service quality.",
    "Building capability in SQL, Python, Azure Functions, Azure SQL, and Grafana to deliver data-driven solutions in the cloud.",
  ],
  location: "Sydney, Australia",
};

// Shared radar taxonomy (order = spoke order, clockwise from top).
export const AXES = [
  "SQL",
  "Python",
  "Network/Cloud",
  "Pipelines/Automation",
  "Reporting/Visualisation",
  "Stakeholder",
  "Incident",
];

// Ceiling raised to 4 so even genuine strengths sit at ~75% (nothing maxes the
// outer ring) — keeps the profile honest rather than overconfident.
export const MAX_AXIS = 4; // 0 none · 1 basic · 2 working · 3 strong · 4 expert (reserved)

// Chart A — Experience (axis values keyed to AXES order)
export const experience = [
  {
    id: "optus",
    role: "Sr. Service Centre Client Specialist",
    org: "Optus",
    period: "Sep 2025 — present",
    current: true,
    blurb:
      "Senior escalation lead for enterprise incidents across fixed network and mobile, coordinating internal, vendor and Client Delivery teams to drive customer-focused resolutions and RCA learnings.",
    //     SQL Py Net Pipe Vis Stake Incident
    axes: [0, 0, 3, 0, 1, 3, 3],
  },
  {
    id: "rcs",
    role: "Senior Traffic Support",
    org: "RCS Australia",
    period: "Oct 2023 — Aug 2025",
    current: false,
    blurb:
      "Incident management, API monitoring and cloud infrastructure support for traffic broadcast software in enterprise environments.",
    axes: [2, 0, 2, 1, 1, 2, 2],
  },
  // Earlier roles — older, primarily data-entry / data-cleaning work. Kept
  // secondary; they reinforce SQL / reporting / data-quality, not headline.
  {
    id: "circana",
    role: "Product Coding & Attribution Specialist",
    org: "Circana",
    period: "Feb 2023 — Aug 2023",
    tier: "earlier",
    blurb: "Re-coded product records against multi-client rulebooks; refined rules to improve data quality.",
    //     SQL Py Net Pipe Vis Stake Incident
    axes: [1, 0, 0, 0, 1, 0, 0],
  },
  {
    id: "ibisworld",
    role: "Enterprise Research Analyst",
    org: "IBISWorld",
    period: "Jun 2021 — Mar 2022",
    tier: "earlier",
    blurb: "Verified financial data across 7,000+ company profiles; co-led the Top 500 Private Companies project.",
    //     SQL Py Net Pipe Vis Stake Incident
    axes: [1, 0, 0, 0, 2, 1, 0],
  },
];

// Chart B — Projects (SGN flagship only, approved roster)
export const projects = [
  {
    id: "sgn",
    flagship: true,
    eyebrow: "Flagship platform",
    title: "Predicting Arrival & Departure Congestion",
    summary:
      "An Azure cloud platform that uses machine learning on live flight data to predict delays and congestion, helping plan contingencies for both arrivals and departures.",
    href: "/sgn/",
    //     SQL Py Net Pipe Vis Stake Incident
    axes: [3, 3, 2, 3, 3, 0, 0],
    components: [
      {
        icon: "⌁",
        title: "Arrival & Departure Delay Prediction",
        body: "A Python ML model predicts arrival delays and their key drivers; aircraft-rotation matching then propagates each inbound delay through turnaround to forecast the departure delay.",
        tags: ["Python", "Pandas", "Scikit-learn", "SQL", "Azure"],
      },
      {
        icon: "▥",
        title: "Immigration Congestion Risk Tool",
        body: "A custom JavaScript web app that maps congestion bands across ML-adjusted arrival slots and recommends immigration buffer times, with a clickable 30-minute congestion chart.",
        tags: ["JavaScript", "Python", "Azure", "SQL"],
      },
    ],
  },
];

export const contact = {
  cv: "/assets/Sylvester-Koh-CV.pdf",
  email: "sylvester@kohstack.au",
  linkedin: "https://www.linkedin.com/in/sylvester-koh/",
  github: "https://github.com/sKoih-pond",
  calendar: "https://calendar.app.google/gcrG9Y83c7zax4oM7",
  upwork: "https://www.upwork.com/freelancers/~014a1010dac4fa36b7?viewMode=1",
};

// Client testimonials — EMPTY until real Upwork reviews exist. Nothing invented:
// while empty the UI shows an honest "coming soon" invitation; it renders cards
// automatically once entries are added here.
//   Shape: { quote, author, role, org, source: "Upwork", date, url }
export const testimonials = [];
