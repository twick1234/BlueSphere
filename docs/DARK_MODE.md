# Dark Mode Support

**Version:** v0.30.0 • **Date:** 2025-09-06

BlueSphere now detects the user’s system preference for **dark mode** and:
- Switches the site palette using `prefers-color-scheme: dark` in `globals.css`.
- Automatically swaps the header logo between `logo.svg` (default) and `logo-mono-light.svg` (on dark backgrounds).

### How it works
- In `Layout.tsx`, a tiny script listens to `matchMedia('(prefers-color-scheme: dark)')` and updates `<img id="bs-logo">` accordingly.
- CSS variables adjust background, text, and link colors for dark mode.

### Customize
- Replace `/public/brand/logo-mono-light.svg` with your own light-on-dark variant to tweak contrast.
- You can also add a manual toggle later that flips a `data-theme` attribute on `<html>` and stores preference in `localStorage`.
