# CABEX — Cab Booking & Fleet Management System

Cab Managment System Made Under DBMS Course ( BCSE302L )

A production-grade React frontend for a cab booking system backed by an Oracle relational schema.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

---

## File Structure

```
cab-booking-system/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                          # React root entry
    ├── App.jsx                           # Router + route definitions
    ├── styles/
    │   └── global.css                    # All design tokens + component styles
    │
    ├── data/
    │   └── mockData.js                   # Simulated data for all 11 Oracle tables
    │
    ├── components/
    │   ├── Layout/
    │   │   ├── Layout.jsx                # App shell: Sidebar + Topbar + <Outlet>
    │   │   └── Sidebar.jsx               # Navigation with NavLink active states
    │   └── Shared/
    │       ├── StatCard.jsx              # KPI metric card (icon, delta, value)
    │       ├── Badge.jsx                 # Coloured status pill
    │       └── Modal.jsx                 # Generic overlay wrapper (Escape to close)
    │
    └── pages/
        ├── Dashboard.jsx                 # Overview: 6 KPIs, bar chart, donut, table
        ├── Bookings.jsx                  # Bookings table + New Booking modal (FK dropdowns)
        ├── Fleet.jsx                     # CABS table with last-service lookup
        ├── Drivers.jsx                   # Driver cards grid with earnings/stats
        └── Maintenance.jsx              # CAB_MAINTENANCE logs + Log Service modal
```

---

## Oracle Table → Component Mapping

| Oracle Table       | Consumed By                                   |
|--------------------|-----------------------------------------------|
| USERS              | Bookings modal (FK select), Dashboard         |
| DRIVERS            | Bookings modal (FK select), Drivers page       |
| CABS               | Fleet page, Maintenance modal (FK select)      |
| CAB_MAINTENANCE    | Maintenance page, Fleet (last service)         |
| BOOKINGS           | Dashboard (recent table), Bookings page        |
| RIDE_TRACKING      | mockData (ready for Tracking page)             |
| RATINGS_REVIEWS    | Dashboard (avg rating stat)                    |
| PAYMENT            | Dashboard (revenue stat), mockData             |
| EARNINGS           | Drivers page (net earnings), Dashboard         |

---

## Key Design Decisions

- **Dark Enterprise theme** — `#0d0f14` base with blue/emerald accents, `DM Sans` + `Space Mono`
- **FK Integrity UI** — All Booking and Maintenance forms use `<select>` dropdowns that are
  populated from the corresponding referenced table (USERS, DRIVERS, CABS), mirroring foreign key
  constraints at the UI layer. FK dropdowns are labelled with a violet `FK → TABLE` badge.
- **Inline SVG charts** — No chart library required; bar and donut charts are rendered with
  pure SVG/CSS for zero extra bundle weight.
- **Modular state** — Each page uses its own `useState` + `useEffect` to simulate async DB fetches.
  Replace `setTimeout` bodies with real `fetch()` calls to wire up a live API.

---

## Extending the Stubs

Three routes have placeholder pages (Payments, Earnings, Tracking).
To build them, create `src/pages/Payments.jsx`, `Earnings.jsx`, `Tracking.jsx`
using the same pattern as the existing pages and update `App.jsx`.
