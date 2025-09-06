# Theme Toggle (Light/Dark/System)

**Version:** v0.31.0 • **Date:** 2025-09-06

BlueSphere exposes a Sun/Moon **theme toggle** so users can override system settings.

- Modes: **System** (default), **Light**, **Dark**
- Persistence: `localStorage['bs-theme']`
- Application: `[data-theme]` attribute on `<html>` + CSS variables in `globals.css`
- Logo: automatically swaps between `logo.svg` and `logo-mono-light.svg`

### Files
- `frontend/bluesphere-site/components/ThemeToggle.tsx`
- `frontend/bluesphere-site/components/Layout.tsx` (wired into header)
- `frontend/bluesphere-site/styles/globals.css` (theme variables)

