# Backtext

Put words **behind** the subject of a photo — entirely in the browser. No uploads, no accounts.

Live cutout runs on-device (IMG.LY background removal, with RMBG fallback). Compose type, paper treatments, subject motion, then export a still or a short clip.

---

## Quick start

```bash
# from the repo root
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

Or deploy the folder as a **static site** on Vercel:

- **Application Preset:** Other  
- **Root Directory:** `./`  
- **Build Command:** leave empty  
- **Output Directory:** leave empty / `.`

---

## How to use

1. **Upload** a photo (or hit **Sample**).
2. Wait for **Subject isolated** — the person is cut out locally.
3. Edit in the right panel, in order:
   - **01 Words** — copy, font, size, position, color  
   - **02 Text look** — layout + finish (neon, paper slab, melt, …)  
   - **03 Subject** — behind/sticker, paper cut on the person, wiggle/bounce/…  
   - **04 Grade** — optional color/FX stack  
4. Export **PNG** or **MP4** (2s / 3s / 5s) from the sticky dock or the top bar.

### Undo / clear effects

| Control | How to undo |
| --- | --- |
| Finish / cut treatment / motion chips | Click the **active chip again** → returns to Clean / Normal / Still |
| Soft shadow, outline, sticker, … | Toggle the switch off |
| Grade stack effect | **Off** = keep but disable · **Remove** = delete · **Clear all effects** |
| Everything style-related | **Reset style** (also clears the grade stack) |

---

## Features

### Text
- Layouts: single, ribbon, circular, spiral, wave, wrap subject, contour, torn, …
- Finishes: neon, extrude, melt, cast shadow, split color, paper slab, particles, …
- **Componentry-inspired animations** (canvas ports of [harshjdhv/componentry](https://github.com/harshjdhv/componentry)):
  - Kinetic reveal, Letter cascade, Hyper scramble, Split flap
  - Text repel (cursor), Marquee, Blur reveal, Slide reveal, Scale pop
- Blend modes + pattern fills

> These are **not** the React/Framer Motion components from Componentry — the motion ideas are reimplemented for Backtext’s canvas pipeline so they work behind the subject cutout and in MP4 export.

### Subject
- Text behind cutout (default once segmented)
- Sticker pop-out, frame breakout, parallax preview
- Paper cut / folded / rolled / crumpled / stack on the **person**
- Motion: wiggle, bounce, sway, float, pulse, jitter, nod

### Grade stack
Add layers such as Gradient Map, Bloom, Film Grain, Vignette, Soft Shadow, Curves, Levels, …  
Each layer has opacity, blend, params, and an optional paint mask.

### Export
- **PNG** — current frame  
- **MP4** — records the live canvas (subject motion + animated finishes). Uses MP4 when the browser supports it; otherwise WebM.

---

## Project layout

| File | Role |
| --- | --- |
| `index.html` | Shell + control panel |
| `styles.css` | Editor UI |
| `app.js` | App state, segmentation, render loop, export |
| `effects.js` | Text layouts/finishes + subject paper/motion |
| `pipeline.js` | Grade effect stack + LUT export |
| `sample.jpg` | Demo photo |

---

## Privacy

Segmentation and rendering run in your browser. Photos are not uploaded to a Backtext server. The first cutout may download a small ML model (~40MB), then caches it.

---

## Browser notes

- Modern Chromium, Firefox, or Safari recommended  
- MP4 recording needs `MediaRecorder` + canvas `captureStream` (Safari often gives MP4; Chrome may give WebM)  
- Large photos are capped at 1600px on the long edge for snappy cutouts

---

## License

Source published for the Backtext project. Use and modify as you like for personal or commercial projects; please keep attribution in the UI brand if you redistribute the app as-is.
