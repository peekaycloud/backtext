/**
 * Backtext Effect Pipeline — Photoshop-style Smart Filters.
 *
 * Image → [Effect, Effect, …] → Export
 * Each effect is a class with params JSON + optional layer mask.
 */

export const PIPELINE_BLENDS = [
  { id: 'source-over', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'hard-light', label: 'Hard Light' },
  { id: 'difference', label: 'Difference' },
  { id: 'exclusion', label: 'Exclusion' },
  { id: 'color-dodge', label: 'Color Dodge' },
  { id: 'color-burn', label: 'Color Burn' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'darken', label: 'Darken' },
];

/* ---------------- utilities ---------------- */

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function cloneCanvas(src) {
  const c = makeCanvas(src.width, src.height);
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

function clamp(v, a = 0, b = 255) {
  return v < a ? a : v > b ? b : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const v = parseInt(full, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Simple value-noise (fast film grain / procedural). */
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm(x, y, octaves = 3) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return val;
}

function boxBlur(srcData, w, h, radius) {
  if (radius < 1) return new Uint8ClampedArray(srcData);
  const tmp = new Uint8ClampedArray(srcData.length);
  const out = new Uint8ClampedArray(srcData.length);
  const r = Math.max(1, Math.round(radius));
  const diam = r * 2 + 1;

  // Horizontal
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sr = 0; let sg = 0; let sb = 0; let sa = 0; let n = 0;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        const i = (y * w + xx) * 4;
        sr += srcData[i]; sg += srcData[i + 1]; sb += srcData[i + 2]; sa += srcData[i + 3];
        n++;
      }
      const o = (y * w + x) * 4;
      tmp[o] = sr / n; tmp[o + 1] = sg / n; tmp[o + 2] = sb / n; tmp[o + 3] = sa / n;
    }
  }
  // Vertical
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sr = 0; let sg = 0; let sb = 0; let sa = 0; let n = 0;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        const i = (yy * w + x) * 4;
        sr += tmp[i]; sg += tmp[i + 1]; sb += tmp[i + 2]; sa += tmp[i + 3];
        n++;
      }
      const o = (y * w + x) * 4;
      out[o] = sr / n; out[o + 1] = sg / n; out[o + 2] = sb / n; out[o + 3] = sa / n;
    }
  }
  return out;
}

function getImageData(canvas) {
  return canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
}

function putImageData(canvas, data) {
  canvas.getContext('2d').putImageData(data, 0, 0);
}

function ensureMask(effect, w, h) {
  if (effect.mask && effect.mask.width === w && effect.mask.height === h) return effect.mask;
  const m = makeCanvas(w, h);
  const c = m.getContext('2d');
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, w, h);
  effect.mask = m;
  return m;
}

/** Composite effect result over base using opacity, blend, and mask. */
function compositeEffect(base, fxCanvas, effect) {
  const out = cloneCanvas(base);
  const ctx = out.getContext('2d');
  const w = base.width;
  const h = base.height;

  if (effect.mask) {
    const masked = makeCanvas(w, h);
    const mctx = masked.getContext('2d');
    mctx.drawImage(fxCanvas, 0, 0);
    mctx.globalCompositeOperation = 'destination-in';
    mctx.drawImage(effect.mask, 0, 0);
    ctx.save();
    ctx.globalAlpha = effect.opacity;
    ctx.globalCompositeOperation = effect.blend || 'source-over';
    ctx.drawImage(masked, 0, 0);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = effect.opacity;
    ctx.globalCompositeOperation = effect.blend || 'source-over';
    ctx.drawImage(fxCanvas, 0, 0);
    ctx.restore();
  }
  return out;
}

/* ---------------- base class ---------------- */

export class Effect {
  static id = 'effect';
  static label = 'Effect';
  static defaults = {};

  constructor(params = {}) {
    this.id = crypto.randomUUID?.() || `fx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.type = this.constructor.id;
    this.enabled = params.enabled !== false;
    this.opacity = params.opacity ?? 1;
    this.blend = params.blend || 'source-over';
    this.mask = null;
    this.params = { ...this.constructor.defaults, ...(params.params || params) };
    // strip meta keys if passed flat
    delete this.params.enabled;
    delete this.params.opacity;
    delete this.params.blend;
    delete this.params.params;
    // Migrate legacy Soft Shadow key
    if (this.type === 'shadow' && this.params.depth != null && this.params.shadow == null) {
      this.params.shadow = this.params.depth;
      delete this.params.depth;
    }
  }

  /** Override: draw filtered look into `out` from `src`. */
  render(src, out) {
    out.getContext('2d').drawImage(src, 0, 0);
  }

  apply(src) {
    if (!this.enabled) return src;
    const out = makeCanvas(src.width, src.height);
    this.render(src, out);
    if (this.opacity >= 0.999 && this.blend === 'source-over' && !this.mask) return out;
    return compositeEffect(src, out, this);
  }

  toJSON() {
    return {
      type: this.type,
      enabled: this.enabled,
      opacity: this.opacity,
      blend: this.blend,
      params: { ...this.params },
      hasMask: !!this.mask,
    };
  }
}

/* ---------------- concrete effects ---------------- */

export class GradientMapEffect extends Effect {
  static id = 'gradientMap';
  static label = 'Gradient Map';
  static defaults = {
    shadows: '#0b1d3a',
    midtones: '#6b3fa0',
    highlights: '#ffe566',
  };

  render(src, out) {
    const { width: w, height: h } = src;
    const img = getImageData(src);
    const d = img.data;
    const s = hexToRgb(this.params.shadows);
    const m = hexToRgb(this.params.midtones);
    const hi = hexToRgb(this.params.highlights);

    for (let i = 0; i < d.length; i += 4) {
      const t = luminance(d[i], d[i + 1], d[i + 2]) / 255;
      let r; let g; let b;
      if (t < 0.5) {
        const u = t * 2;
        r = lerp(s.r, m.r, u);
        g = lerp(s.g, m.g, u);
        b = lerp(s.b, m.b, u);
      } else {
        const u = (t - 0.5) * 2;
        r = lerp(m.r, hi.r, u);
        g = lerp(m.g, hi.g, u);
        b = lerp(m.b, hi.b, u);
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    putImageData(out, img);
  }
}

export class BloomEffect extends Effect {
  static id = 'bloom';
  static label = 'Bloom';
  static defaults = { threshold: 0.65, radius: 12, intensity: 0.85 };

  render(src, out) {
    const { width: w, height: h } = src;
    const ctx = out.getContext('2d');
    ctx.drawImage(src, 0, 0);

    const img = getImageData(src);
    const bright = new Uint8ClampedArray(img.data.length);
    const thr = this.params.threshold * 255;
    for (let i = 0; i < img.data.length; i += 4) {
      const y = luminance(img.data[i], img.data[i + 1], img.data[i + 2]);
      if (y >= thr) {
        bright[i] = img.data[i];
        bright[i + 1] = img.data[i + 1];
        bright[i + 2] = img.data[i + 2];
        bright[i + 3] = img.data[i + 3];
      }
    }
    const blurred = boxBlur(bright, w, h, this.params.radius);
    const glow = makeCanvas(w, h);
    putImageData(glow, new ImageData(blurred, w, h));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = this.params.intensity;
    ctx.drawImage(glow, 0, 0);
    ctx.restore();
  }
}

export class GrainEffect extends Effect {
  static id = 'grain';
  static label = 'Film Grain';
  static defaults = {
    stock: 'kodak', // 35mm | kodak | fuji | ilford | cinema
    amount: 0.35,
    size: 1.2,
  };

  render(src, out) {
    const { width: w, height: h } = src;
    const ctx = out.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = getImageData(out);
    const d = img.data;
    const stock = this.params.stock;
    const amt = this.params.amount * 80;
    // Larger "size" → coarser cells (faster + chunkier grain)
    const cell = Math.max(1, Math.round(this.params.size * 1.6));

    let cr = 1; let cg = 1; let cb = 1;
    if (stock === 'kodak') { cr = 1.05; cg = 0.95; cb = 0.9; }
    else if (stock === 'fuji') { cr = 0.95; cg = 1.05; cb = 1.02; }
    else if (stock === 'ilford') { cr = 1; cg = 1; cb = 1; }
    else if (stock === 'cinema') { cr = 1.08; cg = 0.98; cb = 0.92; }

    // Fast hash noise per grain cell (fbm-per-pixel was multi-second on large photos)
    for (let y = 0; y < h; y++) {
      const gy = (y / cell) | 0;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] < 8) continue;
        const gx = (x / cell) | 0;
        const n = hash2(gx * 12.9898, gy * 78.233);
        if (stock === 'ilford') {
          const yv = luminance(d[i], d[i + 1], d[i + 2]);
          const g = clamp(yv + (n - 0.5) * amt * 2);
          d[i] = g; d[i + 1] = g; d[i + 2] = g;
        } else {
          const noise = (n - 0.5) * amt;
          d[i] = clamp(d[i] * cr + noise);
          d[i + 1] = clamp(d[i + 1] * cg + noise * 0.95);
          d[i + 2] = clamp(d[i + 2] * cb + noise * 1.05);
        }
      }
    }
    putImageData(out, img);
  }
}

export class VignetteEffect extends Effect {
  static id = 'vignette';
  static label = 'Vignette';
  static defaults = { amount: 0.55, softness: 0.45, roundness: 1 };

  render(src, out) {
    const { width: w, height: h } = src;
    const ctx = out.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(cx, cy);
    const soft = this.params.softness;
    const amt = this.params.amount;
    const rnd = this.params.roundness;

    const g = ctx.createRadialGradient(cx, cy, maxR * (1 - soft) * 0.35, cx, cy, maxR * rnd);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

export class GlassEffect extends Effect {
  static id = 'glass';
  static label = 'Glass';
  static defaults = { amount: 4, frequency: 0.04 };

  render(src, out) {
    const { width: w, height: h } = src;
    const ctx = out.getContext('2d');
    // Base copy first so horizontal offsets never leave transparent gaps.
    ctx.drawImage(src, 0, 0);
    const amp = this.params.amount;
    const freq = this.params.frequency;
    const slice = 3;
    for (let y = 0; y < h; y += slice) {
      const hh = Math.min(slice, h - y);
      const dx = Math.sin(y * freq) * amp;
      ctx.drawImage(src, 0, y, w, hh, dx, y, w, hh);
    }
  }
}

export class ShadowEffect extends Effect {
  static id = 'shadow';
  static label = 'Soft Shadow';
  static defaults = { lift: 0.08, shadow: 0.2 };

  render(src, out) {
    const img = getImageData(src);
    const d = img.data;
    const lift = Number(this.params.lift) || 0;
    // Accept legacy `depth` key from older saves / mismatched UI.
    const shadow = Number(this.params.shadow ?? this.params.depth) || 0;
    for (let i = 0; i < d.length; i += 4) {
      const y = luminance(d[i], d[i + 1], d[i + 2]) / 255;
      const mul = 1 - shadow * (1 - y) + lift * y;
      if (!Number.isFinite(mul)) continue;
      d[i] = clamp(d[i] * mul);
      d[i + 1] = clamp(d[i + 1] * mul);
      d[i + 2] = clamp(d[i + 2] * mul);
    }
    putImageData(out, img);
  }
}

export class BrightnessContrastEffect extends Effect {
  static id = 'brightnessContrast';
  static label = 'Brightness / Contrast';
  static defaults = { brightness: 0, contrast: 0 };

  render(src, out) {
    const img = getImageData(src);
    const d = img.data;
    const b = this.params.brightness * 255;
    const c = this.params.contrast;
    const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp(factor * (d[i] - 128) + 128 + b);
      d[i + 1] = clamp(factor * (d[i + 1] - 128) + 128 + b);
      d[i + 2] = clamp(factor * (d[i + 2] - 128) + 128 + b);
    }
    putImageData(out, img);
  }
}

export class HueSaturationEffect extends Effect {
  static id = 'hueSaturation';
  static label = 'Hue / Saturation';
  static defaults = { hue: 0, saturation: 0, lightness: 0 };

  render(src, out) {
    const img = getImageData(src);
    const d = img.data;
    const hShift = this.params.hue;
    const sat = 1 + this.params.saturation;
    const lit = this.params.lightness;
    for (let i = 0; i < d.length; i += 4) {
      let [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
      h = (h + hShift + 360) % 360;
      s = Math.min(1, Math.max(0, s * sat));
      l = Math.min(1, Math.max(0, l + lit));
      const [r, g, b] = hslToRgb(h, s, l);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    putImageData(out, img);
  }
}

export class LevelsEffect extends Effect {
  static id = 'levels';
  static label = 'Levels';
  static defaults = { inBlack: 0, inWhite: 255, gamma: 1, outBlack: 0, outWhite: 255 };

  render(src, out) {
    const img = getImageData(src);
    const d = img.data;
    const { inBlack, inWhite, gamma, outBlack, outWhite } = this.params;
    const span = Math.max(1, inWhite - inBlack);
    for (let i = 0; i < d.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = (d[i + c] - inBlack) / span;
        v = Math.min(1, Math.max(0, v));
        v = Math.pow(v, 1 / Math.max(0.1, gamma));
        d[i + c] = clamp(outBlack + v * (outWhite - outBlack));
      }
    }
    putImageData(out, img);
  }
}

export class CurvesEffect extends Effect {
  static id = 'curves';
  static label = 'Curves';
  static defaults = {
    // control points 0..1
    points: [
      { x: 0, y: 0 },
      { x: 0.25, y: 0.22 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.78 },
      { x: 1, y: 1 },
    ],
  };

  render(src, out) {
    const lut = buildCurveLut(this.params.points);
    const img = getImageData(src);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = lut[d[i]];
      d[i + 1] = lut[d[i + 1]];
      d[i + 2] = lut[d[i + 2]];
    }
    putImageData(out, img);
  }
}

export class HalationEffect extends Effect {
  static id = 'halation';
  static label = 'Film Halation';
  static defaults = { threshold: 0.55, radius: 14, intensity: 0.7, tint: '#ff3355' };

  render(src, out) {
    const { width: w, height: h } = src;
    const ctx = out.getContext('2d');
    ctx.drawImage(src, 0, 0);

    const img = getImageData(src);
    const bright = new Uint8ClampedArray(img.data.length);
    const thr = this.params.threshold * 255;
    const tint = hexToRgb(this.params.tint);

    for (let i = 0; i < img.data.length; i += 4) {
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      const y = luminance(r, g, b);
      // Prefer bright reds / warm highlights
      const warm = r - (g + b) * 0.35;
      if (y >= thr && warm > 8) {
        const a = Math.min(255, (y - thr) * 2 + warm);
        bright[i] = tint.r;
        bright[i + 1] = tint.g;
        bright[i + 2] = tint.b;
        bright[i + 3] = a;
      }
    }
    const blurred = boxBlur(bright, w, h, this.params.radius);
    const glow = makeCanvas(w, h);
    putImageData(glow, new ImageData(blurred, w, h));
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = this.params.intensity;
    ctx.drawImage(glow, 0, 0);
    ctx.restore();
  }
}

/* ---------------- color helpers / curves ---------------- */

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0; let g = 0; let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    clamp((r + m) * 255),
    clamp((g + m) * 255),
    clamp((b + m) * 255),
  ];
}

function buildCurveLut(points) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    // piecewise linear through control points (stable; good enough for v1)
    let y = t;
    for (let p = 0; p < pts.length - 1; p++) {
      const a = pts[p];
      const b = pts[p + 1];
      if (t >= a.x && t <= b.x) {
        const u = (t - a.x) / Math.max(1e-6, b.x - a.x);
        // smoothstep
        const s = u * u * (3 - 2 * u);
        y = lerp(a.y, b.y, s);
        break;
      }
    }
    lut[i] = clamp(Math.round(y * 255));
  }
  return lut;
}

/* ---------------- registry + stack ---------------- */

export const EFFECT_REGISTRY = {
  [GradientMapEffect.id]: GradientMapEffect,
  [BloomEffect.id]: BloomEffect,
  [GrainEffect.id]: GrainEffect,
  [VignetteEffect.id]: VignetteEffect,
  [GlassEffect.id]: GlassEffect,
  [ShadowEffect.id]: ShadowEffect,
  [BrightnessContrastEffect.id]: BrightnessContrastEffect,
  [HueSaturationEffect.id]: HueSaturationEffect,
  [LevelsEffect.id]: LevelsEffect,
  [CurvesEffect.id]: CurvesEffect,
  [HalationEffect.id]: HalationEffect,
};

export const EFFECT_CATALOG = Object.values(EFFECT_REGISTRY).map((Cls) => ({
  id: Cls.id,
  label: Cls.label,
  defaults: { ...Cls.defaults },
}));

export class EffectStack {
  constructor(effects = []) {
    this.effects = effects;
  }

  add(typeOrEffect, params) {
    let fx;
    if (typeOrEffect instanceof Effect) fx = typeOrEffect;
    else {
      const Cls = EFFECT_REGISTRY[typeOrEffect];
      if (!Cls) throw new Error(`Unknown effect: ${typeOrEffect}`);
      fx = new Cls(params);
    }
    this.effects.push(fx);
    return fx;
  }

  remove(id) {
    this.effects = this.effects.filter((e) => e.id !== id);
  }

  get(id) {
    return this.effects.find((e) => e.id === id) || null;
  }

  move(id, dir) {
    const i = this.effects.findIndex((e) => e.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= this.effects.length) return;
    const tmp = this.effects[i];
    this.effects[i] = this.effects[j];
    this.effects[j] = tmp;
  }

  /** Apply full stack. Returns a new canvas. */
  apply(sourceCanvas) {
    let current = sourceCanvas;
    for (const fx of this.effects) {
      if (!fx.enabled) continue;
      current = fx.apply(current);
    }
    return current === sourceCanvas ? cloneCanvas(sourceCanvas) : current;
  }

  toJSON() {
    return this.effects.map((e) => e.toJSON());
  }

  static fromJSON(list) {
    const stack = new EffectStack();
    for (const item of list || []) {
      const Cls = EFFECT_REGISTRY[item.type];
      if (!Cls) continue;
      const fx = new Cls({
        enabled: item.enabled,
        opacity: item.opacity,
        blend: item.blend,
        params: item.params,
      });
      stack.effects.push(fx);
    }
    return stack;
  }
}

/* ---------------- LUT export ---------------- */

/** Bake current stack into a .cube LUT (identity image through stack). */
export function exportCubeLUT(stack, size = 33, name = 'BacktextLUT') {
  // Build a lattice image, run through a 1x1 proxy by evaluating RGB via a small canvas.
  // Faster: apply stack to a strip of all RGB samples is heavy; sample analytically for
  // gradient-map-like chains is hard. Instead render a size³ is too big.
  // Practical approach: generate identity 3D LUT by processing a size×size² image.
  const w = size;
  const h = size * size;
  const lattice = makeCanvas(w, h);
  const lctx = lattice.getContext('2d');
  const img = lctx.createImageData(w, h);
  const d = img.data;
  let p = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const i = p * 4;
        d[i] = Math.round((r / (size - 1)) * 255);
        d[i + 1] = Math.round((g / (size - 1)) * 255);
        d[i + 2] = Math.round((b / (size - 1)) * 255);
        d[i + 3] = 255;
        p++;
      }
    }
  }
  lctx.putImageData(img, 0, 0);
  const baked = stack.apply(lattice);
  const out = getImageData(baked).data;

  let cube = `# Created by Backtext\nTITLE "${name}"\nLUT_3D_SIZE ${size}\nDOMAIN_MIN 0.0 0.0 0.0\nDOMAIN_MAX 1.0 1.0 1.0\n`;
  p = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const i = p * 4;
        cube += `${(out[i] / 255).toFixed(6)} ${(out[i + 1] / 255).toFixed(6)} ${(out[i + 2] / 255).toFixed(6)}\n`;
        p++;
      }
    }
  }
  return cube;
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------------- mask brush ---------------- */

export function paintMaskStroke(maskCanvas, x0, y0, x1, y1, { size = 40, hardness = 0.6, erase = false } = {}) {
  const ctx = maskCanvas.getContext('2d');
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = erase ? '#000000' : '#ffffff';
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = size;
  // Soft edge via shadowBlur approximation
  ctx.shadowColor = erase ? '#000000' : '#ffffff';
  ctx.shadowBlur = size * (1 - hardness) * 0.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

export function clearMask(maskCanvas, fill = '#ffffff') {
  const ctx = maskCanvas.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  ctx.restore();
}

export { ensureMask };
