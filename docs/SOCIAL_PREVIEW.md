# Social Preview Images (Open Graph & Twitter)

**Version:** v0.30.0 • **Date:** 2025-09-06

We generate two branded social preview images:

- **Open Graph**: `frontend/bluesphere-site/public/brand/og-image-1200x630.png` (1200×630)
- **Twitter Card**: `frontend/bluesphere-site/public/brand/twitter-card-1600x900.png` (1600×900)

These are automatically referenced in the site `<head>` via `components/HeadMeta.tsx`.

### Customize
- Edit `HeadMeta.tsx` to change the title/description or point to a hosted URL.
- Replace the PNGs with custom compositions to highlight new features or announcements.
