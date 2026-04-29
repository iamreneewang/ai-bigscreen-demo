# AI Logistics Bigscreen Demo

Standalone interactive prototype for a logistics AI control-tower bigscreen.

## Files

- `index.html` - page structure
- `styles.css` - full-screen bigscreen visual style and 3D-style logistics map
- `script.js` - Globe.GL globe, ECharts panels, full-screen mode, live clock, KPI refresh, AI scenarios, alerts, map focus, and feed updates

## Run

Open `index.html` directly in a browser. No build step or backend is required.
The 3D globe loads Globe.GL from a CDN, and the data charts load ECharts from a CDN, so an internet connection is required unless the libraries are vendored locally.

The layout is optimized for 16:9 presentation screens at 1280px wide or larger.

## Interaction

- Click `Full Screen` to occupy the whole display.
- Click AI action buttons to simulate flight delay, weather risk, provider drop, and warehouse aging scenarios.
- Drag the 3D globe to rotate it.
- Click globe nodes or alert cards to focus the right-side operational details.
- Click `Refresh` to simulate live KPI updates.
- The throughput, risk mix, and provider-performance charts update with simulated live data.
