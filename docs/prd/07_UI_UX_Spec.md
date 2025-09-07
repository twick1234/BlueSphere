# 07 — UI / UX Spec

## Information Architecture
- Home → Map → Station panel → Sources → About → Docs
- Secondary: Consistency, Roadmap, Brand, Education

## Map Interactions
- Pan/zoom; mouse/touch; scroll zoom.
- Layer control: toggle SST / Anomaly / Currents.
- Legend with units and colorbar (see Appendix B).
- Time control: date picker + scrub bar; live “Now” button.
- Click station → side panel with metadata + sparkline chart + link to API.

## States & Empty Cases
- Loading spinner; “No data for this date/area” graceful message.
- Offline banner if API unreachable.

## Accessibility
- Keyboard nav: focus rings on buttons/links; tab order logical.
- ARIA labels for controls; high-contrast mode.
- Dark mode with automatic and manual toggle.

## Export
- “Share view” copies URL + captures PNG of map with legend and timestamp.
