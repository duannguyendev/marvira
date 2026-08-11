# Marvira app icon

Source of truth for the launcher / marketing icon (Option 27 letter lockup, light indigo).

## Files

| File | Purpose |
|------|---------|
| `marvira-app-icon.svg` | Full icon (light indigo bg) — iOS, marketing, Android legacy |
| `marvira-app-icon-foreground.svg` | Android adaptive foreground (transparent) |
| `marvira-app-icon.png` | 1024 preview |
| `marvira-icon-master.png` | 1024 master PNG |
| `generate.js` | Rasterize SVG → all platform sizes |

## Current settings

- **Background:** `#A5B4FC` → `#818CF8`
- **Mark size:** `scale(2)` on master (iOS / marketing); foreground `scale(1.1)` (Android adaptive)
- **Stroke:** `64` (i-dot `r=32`, cy=`63`, cutout halo `r=40`)
- **M:** no right vertical; yellow `i` stem fills that edge up to the cutout

## Regenerate platform icons

```bash
npm install --no-save @resvg/resvg-js sharp
node app-icon/generate.js
```

Then rebuild the mobile app to see launcher changes.
