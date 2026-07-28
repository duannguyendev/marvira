# Marvira app icon

Source of truth for the launcher / marketing icon (Option 27 letter lockup).

## Files

| File | Purpose |
|------|---------|
| `marvira-app-icon.svg` | Full icon (gradient bg) — iOS, marketing, Android legacy |
| `marvira-app-icon-foreground.svg` | Android adaptive foreground (transparent) |
| `marvira-app-icon.png` | 1024 preview |
| `marvira-app-icon-expanded-1.5x.png` | 1536 preview |
| `marvira-icon-master.png` | 1024 master PNG |
| `generate.js` | Rasterize SVG → all platform sizes |

## Tweak scale or stroke

In `marvira-app-icon.svg` / `marvira-app-icon-foreground.svg`:

- **Mark size:** `scale(0.95)` on `#mark` (foreground uses `0.92`)
- **Stroke:** `stroke-width="50"` (keep i-dot `r` ≈ half, e.g. `25`)

## Regenerate platform icons

```bash
npm install --no-save @resvg/resvg-js sharp
node app-icon/generate.js
```

Then rebuild the mobile app to see launcher changes.
