// Text layouts + finish effects for Backtext (canvas 2D).

export const LAYOUTS = [
  { id: 'single', label: 'Single' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'circular', label: 'Circular' },
  { id: 'spiral', label: 'Spiral' },
  { id: 'wave', label: 'Wave' },
  { id: 'snake', label: 'Snake' },
  { id: 'figure8', label: 'Figure-8' },
  { id: 'wrap', label: 'Wrap subject' },
  { id: 'contour', label: 'Along contour' },
  { id: 'zoom', label: 'Zoom tunnel' },
  { id: 'broken', label: 'Broken pieces' },
  { id: 'torn', label: 'Torn' },
];

export const FINISHES = [
  { id: 'none', label: 'Clean' },
  { id: 'neon', label: 'Neon tube' },
  { id: 'extrude', label: '3D extrude' },
  { id: 'reflect', label: 'Reflection' },
  { id: 'melt', label: 'Melt into subject' },
  { id: 'castShadow', label: 'Cast on subject' },
  { id: 'splitColor', label: 'Split color' },
  { id: 'chroma', label: 'Chromatic' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'pattern', label: 'Pattern fill' },
  { id: 'ink', label: 'Ink bleed' },
  { id: 'noise', label: 'Film grain' },
  { id: 'motion', label: 'Motion blur' },
  { id: 'wavy', label: 'Wavy anim' },
  { id: 'fog', label: 'Depth fog' },
  { id: 'sweep', label: 'Light sweep' },
  { id: 'particles', label: 'Particles' },
  { id: 'smoke', label: 'Smoke' },
  { id: 'liquid', label: 'Liquid lens' },
  { id: 'glass', label: 'Glass' },
  { id: 'explosion', label: 'Explosion' },
  { id: 'kinetic', label: 'Kinetic' },
  // Componentry-inspired text animations (ported to canvas)
  // https://github.com/harshjdhv/componentry
  { id: 'kineticReveal', label: 'Kinetic reveal' },
  { id: 'letterCascade', label: 'Letter cascade' },
  { id: 'hyperText', label: 'Hyper scramble' },
  { id: 'splitFlap', label: 'Split flap' },
  { id: 'textRepel', label: 'Text repel' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'blurReveal', label: 'Blur reveal' },
  { id: 'slideReveal', label: 'Slide reveal' },
  { id: 'scalePop', label: 'Scale pop' },
  { id: 'signature', label: 'Signature' },
  { id: 'paper', label: 'Paper cut' },
  { id: 'paperFolded', label: 'Folded paper' },
  { id: 'paperRolled', label: 'Rolled paper' },
  { id: 'paperCrumpled', label: 'Crumpled paper' },
  { id: 'paperStack', label: 'Paper stack' },
];

/** Shared defaults for all paper finishes. */
export const PAPER_DEFAULTS = {
  thickness: 0.55,
  bevel: 0.5,
  texture: 0.45,
  torn: 0.4,
  curl: 0.45,
  shadowSoft: 0.55,
  tint: '#f3ead7',
};

export function isPaperFinish(finish) {
  return (
    finish === 'paper' ||
    finish === 'paperFolded' ||
    finish === 'paperRolled' ||
    finish === 'paperCrumpled' ||
    finish === 'paperStack'
  );
}

export const BLENDS = [
  { id: 'source-over', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'soft-light', label: 'Soft Light' },
  { id: 'difference', label: 'Difference' },
  { id: 'color-dodge', label: 'Color Dodge' },
];

export const PATTERNS = [
  { id: 'stripes', label: 'Stripes' },
  { id: 'dots', label: 'Dots' },
  { id: 'checker', label: 'Checker' },
  { id: 'waves', label: 'Waves' },
  { id: 'mesh', label: 'Mesh gradient' },
];

export function needsAnimation(finish) {
  return (
    finish === 'sweep' ||
    finish === 'particles' ||
    finish === 'smoke' ||
    finish === 'liquid' ||
    finish === 'wavy' ||
    finish === 'explosion' ||
    finish === 'kinetic' ||
    finish === 'noise' ||
    finish === 'ink' ||
    finish === 'glass' ||
    isComponentryAnimFinish(finish)
  );
}

const COMPONENTRY_ANIM_FINISHES = new Set([
  'kineticReveal',
  'letterCascade',
  'hyperText',
  'splitFlap',
  'textRepel',
  'marquee',
  'blurReveal',
  'slideReveal',
  'scalePop',
  'signature',
]);

export function isComponentryAnimFinish(finish) {
  return COMPONENTRY_ANIM_FINISHES.has(finish);
}

export const SUBJECT_MOTIONS = [
  { id: 'none', label: 'Still' },
  { id: 'wiggle', label: 'Wiggle' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'sway', label: 'Sway' },
  { id: 'float', label: 'Float' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'jitter', label: 'Jitter' },
  { id: 'nod', label: 'Nod' },
];

export function needsSubjectAnimation(motion) {
  return !!(motion && motion !== 'none');
}

/**
 * Pivot + transform for looping subject motion.
 * Returns { cx, cy, dx, dy, rot, scale } to apply around the subject.
 */
export function subjectMotionPose(motion, time, amount, bounds) {
  const a = Math.max(0, Math.min(1, amount ?? 0.55));
  const cx = bounds.x + bounds.w * 0.5;
  const cy = bounds.y + bounds.h * 0.62;
  const t = time * 0.001;
  const identity = { cx, cy, dx: 0, dy: 0, rot: 0, scale: 1 };
  if (!motion || motion === 'none' || a < 0.01) return identity;

  switch (motion) {
    case 'wiggle':
      return {
        cx,
        cy,
        dx: Math.sin(t * 11.2) * 7 * a + Math.sin(t * 17.5) * 3 * a,
        dy: Math.cos(t * 13.1) * 3.5 * a,
        rot: Math.sin(t * 9.5) * 0.055 * a + Math.sin(t * 15.2) * 0.025 * a,
        scale: 1 + Math.sin(t * 8.2) * 0.012 * a,
      };
    case 'bounce': {
      const wave = Math.abs(Math.sin(t * 5.6));
      return {
        cx,
        cy,
        dx: Math.sin(t * 5.6) * 2 * a,
        dy: -wave * 22 * a,
        rot: Math.sin(t * 5.6) * 0.03 * a,
        scale: 1 + (1 - wave) * 0.04 * a,
      };
    }
    case 'sway':
      return {
        cx,
        cy: bounds.y + bounds.h * 0.92,
        dx: Math.sin(t * 2.4) * 10 * a,
        dy: Math.abs(Math.sin(t * 2.4)) * 2 * a,
        rot: Math.sin(t * 2.4) * 0.09 * a,
        scale: 1,
      };
    case 'float':
      return {
        cx,
        cy,
        dx: Math.sin(t * 1.6) * 5 * a,
        dy: Math.sin(t * 2.1) * 12 * a,
        rot: Math.sin(t * 1.4) * 0.03 * a,
        scale: 1 + Math.sin(t * 2.1) * 0.015 * a,
      };
    case 'pulse': {
      const p = 0.5 + 0.5 * Math.sin(t * 4.2);
      return {
        cx,
        cy,
        dx: 0,
        dy: (1 - p) * 4 * a,
        rot: 0,
        scale: 1 + p * 0.06 * a,
      };
    }
    case 'jitter': {
      const jx = Math.sin(t * 37) * 4.5 + Math.sin(t * 53.1) * 2.2;
      const jy = Math.cos(t * 41.3) * 3.8 + Math.sin(t * 29.7) * 2;
      return {
        cx,
        cy,
        dx: jx * a,
        dy: jy * a,
        rot: Math.sin(t * 47) * 0.035 * a,
        scale: 1 + Math.sin(t * 33) * 0.01 * a,
      };
    }
    case 'nod':
      return {
        cx,
        cy: bounds.y + bounds.h * 0.22,
        dx: 0,
        dy: Math.sin(t * 4.8) * 6 * a,
        rot: Math.sin(t * 4.8) * 0.07 * a,
        scale: 1,
      };
    default:
      return identity;
  }
}

/** Apply a subjectMotionPose to a 2D context. */
export function applySubjectMotionTransform(ctx, pose) {
  if (!pose) return;
  ctx.translate(pose.cx + pose.dx, pose.cy + pose.dy);
  if (pose.rot) ctx.rotate(pose.rot);
  if (pose.scale && pose.scale !== 1) ctx.scale(pose.scale, pose.scale);
  ctx.translate(-pose.cx, -pose.cy);
}

function applyFont(c, state, size = state.size) {
  c.font = `${size}px "${state.font}"`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  try { c.letterSpacing = `${state.letterSpacing}px`; } catch (_) { /* */ }
}

function wordUnit(state) {
  return (state.text || 'TEXT').replace(/\n+/g, ' ').trim() || 'TEXT';
}

function glyphUnits(state) {
  const unit = wordUnit(state);
  if (state.layout === 'ribbon' || state.layout === 'single' || state.layout === 'torn' || state.layout === 'wrap') {
    return unit.split(/\s+/).filter(Boolean);
  }
  return Array.from(unit.replace(/\s+/g, ''));
}

function measureGlyph(c, state, g) {
  applyFont(c, state);
  return c.measureText(g).width + state.letterSpacing + state.size * 0.18;
}

/** Sample a parametric path into points {x,y,angle}. */
function samplePath(fn, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = fn(t);
    const q = fn(Math.min(1, t + 1 / steps));
    pts.push({
      x: p.x,
      y: p.y,
      angle: Math.atan2(q.y - p.y, q.x - p.x),
      t,
    });
  }
  return pts;
}

function pathCircular(cx, cy, rx, ry) {
  return (t) => {
    const a = t * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  };
}

function pathSpiral(cx, cy, r0, r1, turns) {
  return (t) => {
    const a = t * Math.PI * 2 * turns - Math.PI / 2;
    const r = r0 + (r1 - r0) * t;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  };
}

function pathWave(cx, cy, width, amp, waves) {
  return (t) => {
    const x = cx - width / 2 + width * t;
    const y = cy + Math.sin(t * Math.PI * 2 * waves) * amp;
    return { x, y };
  };
}

function pathSnake(cx, cy, width, amp, segs) {
  return (t) => {
    const x = cx - width / 2 + width * t;
    const y = cy + Math.sin(t * Math.PI * segs) * amp * (0.55 + 0.45 * Math.cos(t * Math.PI));
    return { x, y };
  };
}

function pathFigure8(cx, cy, rx, ry) {
  return (t) => {
    const a = t * Math.PI * 2;
    // Lemniscate of Gerono
    return {
      x: cx + Math.sin(a) * rx,
      y: cy + Math.sin(a) * Math.cos(a) * ry,
    };
  };
}

function placeAlongPath(c, state, pathFn, countHint) {
  const glyphs = [];
  const unit = wordUnit(state);
  const chars = Array.from(unit);
  // Repeat enough to fill the path.
  const repeats = Math.max(4, Math.ceil((countHint || 24) / Math.max(1, chars.length)));
  for (let r = 0; r < repeats; r++) {
    for (const ch of chars) glyphs.push(ch);
    glyphs.push(' ');
  }

  const steps = Math.max(80, glyphs.length * 4);
  const pts = samplePath(pathFn, steps);
  // Arc-length parameterization
  let total = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    total += Math.hypot(dx, dy);
    cum.push(total);
  }
  if (total < 1) return [];

  const placed = [];
  let cursor = 0;
  for (const g of glyphs) {
    const w = Math.max(state.size * 0.35, measureGlyph(c, state, g === ' ' ? '·' : g) * (g === ' ' ? 0.55 : 1));
    if (cursor + w / 2 > total) break;
    const target = cursor + w / 2;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const seg = cum[i] - cum[i - 1] || 1;
    const u = (target - cum[i - 1]) / seg;
    const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u;
    const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u;
    const angle = pts[i - 1].angle;
    placed.push({ g, x, y, angle, w });
    cursor += w;
  }
  return placed;
}

function drawPlacedGlyphs(c, state, placed, paint) {
  for (const p of placed) {
    if (p.g === ' ') continue;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle + (state.rotation * Math.PI) / 180);
    applyFont(c, state);
    paint(c, p.g, 0, 0);
    c.restore();
  }
}

function drawRibbonRows(c, state, paint) {
  const unit = wordUnit(state);
  applyFont(c, state);
  const gap = state.size * 0.35 + state.letterSpacing;
  const phrase = `${unit} `;
  const phraseW = c.measureText(phrase).width || state.size * unit.length * 0.5;
  const rows = Math.max(3, Math.ceil(state.h / (state.size * state.lineHeight)) + 1);
  const lh = state.size * Math.max(0.85, state.lineHeight);

  c.save();
  c.translate(state.x * state.w, state.y * state.h);
  c.rotate((state.rotation * Math.PI) / 180);
  c.globalAlpha = state.opacity;

  for (let row = -Math.floor(rows / 2); row <= Math.floor(rows / 2); row++) {
    const y = row * lh;
    const offset = ((row % 2 === 0 ? 0 : phraseW * 0.5) + state.x * 40) % phraseW;
    const startX = -state.w * 0.85 - offset;
    const endX = state.w * 0.85;
    for (let x = startX; x < endX; x += phraseW) {
      paint(c, phrase.trimEnd(), x + phraseW / 2, y);
    }
  }
  c.restore();
}

function drawSingle(c, state, paint) {
  const lines = state.text.split('\n');
  const lh = state.size * state.lineHeight;
  const total = lh * (lines.length - 1);
  c.save();
  c.translate(state.x * state.w, state.y * state.h);
  c.rotate((state.rotation * Math.PI) / 180);
  c.globalAlpha = state.opacity;
  applyFont(c, state);
  lines.forEach((line, i) => {
    paint(c, line, 0, i * lh - total / 2);
  });
  c.restore();
}

/** Build a coarse occupancy grid from subject alpha. */
export function buildMaskGrid(fg, w, h, cell = 8) {
  if (!fg) return null;
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext('2d', { willReadFrequently: true });
  tctx.drawImage(fg, 0, 0, w, h);
  const { data } = tctx.getImageData(0, 0, w, h);
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const occ = new Uint8Array(cols * rows);
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      let hit = 0;
      const x0 = gx * cell;
      const y0 = gy * cell;
      for (let y = y0; y < Math.min(h, y0 + cell); y += 2) {
        for (let x = x0; x < Math.min(w, x0 + cell); x += 2) {
          if (data[(y * w + x) * 4 + 3] > 40) hit++;
        }
      }
      occ[gy * cols + gx] = hit > 2 ? 1 : 0;
    }
  }
  // Soft expand one cell so text keeps clearance.
  const expanded = new Uint8Array(occ);
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (!occ[gy * cols + gx]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) expanded[ny * cols + nx] = 1;
        }
      }
    }
  }
  return { occ: expanded, cols, rows, cell, w, h };
}

function drawWrap(c, state, mask, paint) {
  const unit = wordUnit(state);
  const words = [];
  while (words.length < 160) words.push(...unit.split(/\s+/).filter(Boolean));

  // Close-up subjects leave thin gutters — shrink type until a row can hold a word.
  const sizes = [
    state.size,
    Math.round(state.w * 0.07),
    Math.round(state.w * 0.05),
    Math.round(state.w * 0.038),
    Math.round(state.w * 0.028),
  ].filter((s, i, arr) => s >= 14 && arr.indexOf(s) === i);

  let usedSize = sizes[sizes.length - 1];
  let placedAny = false;

  for (const size of sizes) {
    const trial = { ...state, size };
    c.save();
    applyFont(c, trial);
    const sample = c.measureText(words[0] || 'A').width;
    const runs = freeRunsAtY(mask, state.h * 0.5, state.w);
    const widest = runs.reduce((m, r) => Math.max(m, r.x1 - r.x0), 0);
    c.restore();
    if (widest > sample + 24 || size === sizes[sizes.length - 1]) {
      usedSize = size;
      break;
    }
  }

  const local = { ...state, size: usedSize };
  applyFont(c, local);
  const lh = usedSize * Math.max(1.05, state.lineHeight);
  let wi = 0;
  c.save();
  c.globalAlpha = state.opacity;

  for (let y = usedSize * 0.65; y < state.h - usedSize * 0.25; y += lh) {
    const runs = freeRunsAtY(mask, y, state.w);
    for (const run of runs) {
      let x = run.x0 + 6;
      const limit = run.x1 - 6;
      while (x < limit && wi < words.length) {
        const word = words[wi];
        const ww = c.measureText(word).width;
        if (ww < 4) { wi++; continue; }
        if (x + ww > limit) {
          // try next run rather than stalling forever on one fat word
          break;
        }
        paint(c, word, x + ww / 2, y);
        placedAny = true;
        x += ww + usedSize * 0.25 + state.letterSpacing;
        wi++;
      }
    }
  }

  // If the subject fills the frame, fall back to a soft ribbon behind it.
  if (!placedAny) {
    drawRibbonRows(c, local, paint);
  }
  c.restore();
}

function freeRunsAtY(mask, y, w) {
  if (!mask) return [{ x0: 16, x1: w - 16 }];
  const gy = Math.min(mask.rows - 1, Math.max(0, Math.floor(y / mask.cell)));
  const runs = [];
  let start = null;
  for (let gx = 0; gx < mask.cols; gx++) {
    const blocked = mask.occ[gy * mask.cols + gx];
    if (!blocked && start == null) start = gx;
    if ((blocked || gx === mask.cols - 1) && start != null) {
      const end = blocked ? gx : gx + 1;
      const x0 = start * mask.cell;
      const x1 = end * mask.cell;
      if (x1 - x0 > mask.cell * 2) runs.push({ x0, x1: Math.min(w, x1) });
      start = null;
    }
  }
  return runs.length ? runs : [{ x0: 16, x1: w - 16 }];
}

function drawTorn(c, state, fg, paint) {
  const lines = state.text.split('\n');
  const top = lines[0] || wordUnit(state);
  const bottom = lines[1] || lines[0] || wordUnit(state);
  const cx = state.x * state.w;
  const cy = state.y * state.h;

  // Top half
  c.save();
  c.beginPath();
  jaggedBand(c, 0, 0, state.w, cy - state.size * 0.15, 1);
  c.clip();
  c.globalAlpha = state.opacity;
  applyFont(c, state);
  paint(c, top, cx, cy - state.size * 0.85);
  c.restore();

  // Bottom half
  c.save();
  c.beginPath();
  jaggedBand(c, 0, cy + state.size * 0.15, state.w, state.h, -1);
  c.clip();
  c.globalAlpha = state.opacity;
  applyFont(c, state);
  paint(c, bottom, cx, cy + state.size * 0.85);
  c.restore();

  // Tear edge lines
  c.save();
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.lineWidth = 1.5;
  drawJaggedStroke(c, 0, cy - state.size * 0.15, state.w, 1);
  drawJaggedStroke(c, 0, cy + state.size * 0.15, state.w, -1);
  c.restore();
}

function jaggedBand(c, x, y0, w, y1, dir) {
  c.moveTo(x, y0);
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const j = Math.sin(t * 37.1) * 7 + Math.sin(t * 11.3) * 4;
    c.lineTo(x + w * t, (dir > 0 ? y1 : y0) + j * dir);
  }
  if (dir > 0) {
    c.lineTo(x + w, 0);
    c.lineTo(x, 0);
  } else {
    c.lineTo(x + w, y1);
    c.lineTo(x, y1);
  }
  c.closePath();
}

function drawJaggedStroke(c, x, y, w, dir) {
  c.beginPath();
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const j = Math.sin(t * 37.1) * 7 + Math.sin(t * 11.3) * 4;
    const yy = y + j * dir;
    if (i === 0) c.moveTo(x, yy);
    else c.lineTo(x + w * t, yy);
  }
  c.stroke();
}

function paintBasic(state) {
  return (c, text, x, y) => {
    if (state.shadow) {
      c.shadowColor = 'rgba(0,0,0,0.45)';
      c.shadowBlur = state.size * 0.16;
      c.shadowOffsetY = state.size * 0.04;
    }
    if (state.stroke) {
      c.lineWidth = Math.max(2, state.size * 0.055);
      c.lineJoin = 'round';
      c.strokeStyle = 'rgba(0,0,0,0.85)';
      c.strokeText(text, x, y);
    }
    c.fillStyle = state.color;
    c.fillText(text, x, y);
    c.shadowColor = 'transparent';
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
  };
}

function paintNeon(state) {
  const glow = state.color;
  return (c, text, x, y) => {
    c.save();
    c.shadowColor = glow;
    c.shadowBlur = state.size * 0.55;
    c.fillStyle = glow;
    c.fillText(text, x, y);
    c.shadowBlur = state.size * 0.25;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
    c.fillStyle = '#fff';
    c.globalAlpha = 0.92;
    c.fillText(text, x, y);
    c.restore();
  };
}

function paintExtrude(state) {
  const depth = Math.max(6, Math.round(state.size * 0.22));
  return (c, text, x, y) => {
    c.save();
    for (let i = depth; i >= 1; i--) {
      const t = i / depth;
      c.fillStyle = shade(state.color, -0.55 + t * 0.2);
      c.fillText(text, x + i * 0.65, y + i);
    }
    if (state.stroke) {
      c.lineWidth = Math.max(2, state.size * 0.04);
      c.strokeStyle = 'rgba(0,0,0,0.5)';
      c.strokeText(text, x, y);
    }
    c.fillStyle = state.color;
    c.fillText(text, x, y);
    c.restore();
  };
}

function shade(hex, amt) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const num = parseInt(full, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.min(255, Math.max(0, Math.round(r + amt * 255)));
  g = Math.min(255, Math.max(0, Math.round(g + amt * 255)));
  b = Math.min(255, Math.max(0, Math.round(b + amt * 255)));
  return `rgb(${r},${g},${b})`;
}

function drawLayout(c, state, mask, fg, paint) {
  const cx = state.x * state.w;
  const cy = state.y * state.h;
  const rx = state.w * 0.32;
  const ry = state.h * 0.28;

  switch (state.layout) {
    case 'ribbon':
      drawRibbonRows(c, state, paint);
      break;
    case 'circular': {
      const placed = placeAlongPath(c, state, pathCircular(cx, cy, rx, ry), 40);
      c.save();
      c.globalAlpha = state.opacity;
      drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
      c.restore();
      break;
    }
    case 'spiral': {
      const placed = placeAlongPath(c, state, pathSpiral(cx, cy, state.size * 0.4, Math.min(rx, ry) * 1.15, 3.2), 50);
      c.save();
      c.globalAlpha = state.opacity;
      drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
      c.restore();
      break;
    }
    case 'wave': {
      const placed = placeAlongPath(c, state, pathWave(cx, cy, state.w * 0.92, state.size * 0.55, 2.5), 36);
      c.save();
      c.globalAlpha = state.opacity;
      drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
      c.restore();
      break;
    }
    case 'snake': {
      const placed = placeAlongPath(c, state, pathSnake(cx, cy, state.w * 0.9, state.size * 0.7, 5), 40);
      c.save();
      c.globalAlpha = state.opacity;
      drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
      c.restore();
      break;
    }
    case 'figure8': {
      const placed = placeAlongPath(c, state, pathFigure8(cx, cy, rx * 0.95, ry * 1.1), 44);
      c.save();
      c.globalAlpha = state.opacity;
      drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
      c.restore();
      break;
    }
    case 'wrap':
      drawWrap(c, state, mask, paint);
      break;
    case 'contour':
      drawContour(c, state, mask, fg, paint);
      break;
    case 'zoom':
      drawZoomTunnel(c, state, paint);
      break;
    case 'broken':
      drawBroken(c, state, paint, 0);
      break;
    case 'torn':
      drawTorn(c, state, fg, paint);
      break;
    default:
      drawSingle(c, state, paint);
  }
}

/** Angle-sorted silhouette edge → closed path for contour text. */
export function extractContourPath(fg, w, h, maxPts = 160) {
  if (!fg) return null;
  const cell = 4;
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext('2d', { willReadFrequently: true });
  tctx.drawImage(fg, 0, 0, w, h);
  const { data } = tctx.getImageData(0, 0, w, h);
  const edges = [];
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y += cell) {
    for (let x = 1; x < w - 1; x += cell) {
      const a = data[(y * w + x) * 4 + 3];
      if (a < 40) continue;
      sx += x;
      sy += y;
      n++;
      const ring =
        data[((y - cell) * w + x) * 4 + 3] < 40 ||
        data[((y + cell) * w + x) * 4 + 3] < 40 ||
        data[(y * w + (x - cell)) * 4 + 3] < 40 ||
        data[(y * w + (x + cell)) * 4 + 3] < 40;
      if (ring) edges.push({ x, y });
    }
  }
  if (!edges.length || !n) return null;
  const cx = sx / n;
  const cy = sy / n;
  edges.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  // Decimate
  const step = Math.max(1, Math.floor(edges.length / maxPts));
  const pts = [];
  for (let i = 0; i < edges.length; i += step) pts.push(edges[i]);
  if (pts.length < 8) return null;
  // Expand slightly outward so text sits just outside the body
  const out = pts.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const push = Math.max(12, Math.min(w, h) * 0.02);
    return { x: p.x + (dx / len) * push, y: p.y + (dy / len) * push };
  });
  return { pts: out, cx, cy };
}

function drawContour(c, state, mask, fg, paint) {
  const contour = extractContourPath(fg, state.w, state.h);
  if (!contour) {
    drawCircularFallback(c, state, paint);
    return;
  }
  const { pts } = contour;
  const pathFn = (t) => {
    const i = t * pts.length;
    const i0 = Math.floor(i) % pts.length;
    const i1 = (i0 + 1) % pts.length;
    const u = i - Math.floor(i);
    return {
      x: pts[i0].x + (pts[i1].x - pts[i0].x) * u,
      y: pts[i0].y + (pts[i1].y - pts[i0].y) * u,
    };
  };
  const placed = placeAlongPath(c, state, pathFn, Math.max(36, pts.length));
  c.save();
  c.globalAlpha = state.opacity;
  drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
  c.restore();
}

function drawCircularFallback(c, state, paint) {
  const cx = state.x * state.w;
  const cy = state.y * state.h;
  const placed = placeAlongPath(c, state, pathCircular(cx, cy, state.w * 0.32, state.h * 0.28), 40);
  c.save();
  c.globalAlpha = state.opacity;
  drawPlacedGlyphs(c, state, placed, (ctx, g, x, y) => paint(ctx, g, x, y));
  c.restore();
}

function drawZoomTunnel(c, state, paint) {
  const cx = state.x * state.w;
  const cy = state.y * state.h;
  const unit = wordUnit(state);
  c.save();
  c.translate(cx, cy);
  c.rotate((state.rotation * Math.PI) / 180);
  for (let i = 12; i >= 0; i--) {
    const t = i / 12;
    const s = 0.12 + t * 0.95;
    c.save();
    c.scale(s, s);
    c.globalAlpha = state.opacity * (0.2 + t * 0.8);
    const local = { ...state, size: state.size };
    applyFont(c, local);
    paint(c, unit, 0, 0);
    c.restore();
  }
  c.restore();
}

function drawBroken(c, state, paint, time) {
  const unit = wordUnit(state).replace(/\s+/g, '');
  const chars = Array.from(unit);
  if (!chars.length) return;
  const cx = state.x * state.w;
  const cy = state.y * state.h;
  const explode = state.finish === 'explosion' ? Math.min(1, (time % 2400) / 2400) : 0.55;
  c.save();
  c.globalAlpha = state.opacity;
  applyFont(c, state);
  chars.forEach((ch, i) => {
    const seed = i * 12.9898;
    const ang = seed + i;
    const dist = state.size * (0.55 + (i % 5) * 0.22) * (0.35 + explode);
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang * 1.3) * dist * 0.85;
    const rot = ((seed * 3) % 1) * 1.2 - 0.6 + (state.finish === 'kinetic' ? Math.sin(time / 400 + i) * 0.4 : 0);
    c.save();
    c.translate(x, y);
    c.rotate(rot + (state.rotation * Math.PI) / 180);
    if (state.finish === 'kinetic') {
      c.translate(Math.sin(time / 350 + i * 1.7) * 6, Math.cos(time / 420 + i) * 5);
    }
    paint(c, ch, 0, 0);
    c.restore();
  });
  c.restore();
}

function choosePaint(state, time = 0) {
  if (state.finish === 'neon') return paintNeon(state);
  if (state.finish === 'extrude') return paintExtrude(state);
  if (state.finish === 'halftone') return paintHalftone(state);
  if (state.finish === 'pattern') return paintPattern(state, time);
  if (state.finish === 'fog') return paintFog(state);
  return paintBasic(state);
}

function paintHalftone(state) {
  return (c, text, x, y) => {
    const off = document.createElement('canvas');
    const pad = state.size * 2;
    off.width = Math.ceil(state.size * Math.max(2, text.length) * 0.7 + pad);
    off.height = Math.ceil(state.size * 1.4 + pad);
    const o = off.getContext('2d');
    o.font = c.font;
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    o.fillText(text, off.width / 2, off.height / 2);
    const { data } = o.getImageData(0, 0, off.width, off.height);
    const step = Math.max(3, Math.round(state.size * 0.06));
    c.save();
    c.fillStyle = state.color;
    for (let py = 0; py < off.height; py += step) {
      for (let px = 0; px < off.width; px += step) {
        const a = data[(py * off.width + px) * 4 + 3];
        if (a < 40) continue;
        const r = (a / 255) * (step * 0.48);
        c.beginPath();
        c.arc(x - off.width / 2 + px, y - off.height / 2 + py, r, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  };
}

function paintPattern(state, time) {
  return (c, text, x, y) => {
    const pat = makePattern(c, state, time);
    c.save();
    c.fillStyle = pat || state.color;
    c.fillText(text, x, y);
    c.restore();
  };
}

function makePattern(c, state, time) {
  const tile = document.createElement('canvas');
  tile.width = 24;
  tile.height = 24;
  const t = tile.getContext('2d');
  const kind = state.pattern || 'stripes';
  t.fillStyle = state.color;
  if (kind === 'stripes') {
    t.fillRect(0, 0, 24, 24);
    t.fillStyle = shade(state.color, -0.35);
    t.fillRect(0, 0, 24, 8);
    t.fillRect(0, 16, 24, 8);
  } else if (kind === 'dots') {
    t.fillStyle = shade(state.color, -0.4);
    t.fillRect(0, 0, 24, 24);
    t.fillStyle = state.color;
    t.beginPath();
    t.arc(12, 12, 5 + Math.sin(time / 400) * 1.5, 0, Math.PI * 2);
    t.fill();
  } else if (kind === 'checker') {
    t.fillStyle = state.color;
    t.fillRect(0, 0, 12, 12);
    t.fillRect(12, 12, 12, 12);
    t.fillStyle = shade(state.color, -0.4);
    t.fillRect(12, 0, 12, 12);
    t.fillRect(0, 12, 12, 12);
  } else if (kind === 'waves') {
    t.fillStyle = shade(state.color, -0.35);
    t.fillRect(0, 0, 24, 24);
    t.strokeStyle = state.color;
    t.lineWidth = 3;
    t.beginPath();
    for (let x = 0; x <= 24; x++) {
      const y = 12 + Math.sin(x * 0.5 + time / 300) * 6;
      if (x === 0) t.moveTo(x, y);
      else t.lineTo(x, y);
    }
    t.stroke();
  } else {
    // mesh-ish gradient tile
    const g = t.createLinearGradient(0, 0, 24, 24);
    g.addColorStop(0, state.color);
    g.addColorStop(0.5, state.color2 || '#ff4d6d');
    g.addColorStop(1, shade(state.color, -0.3));
    t.fillStyle = g;
    t.fillRect(0, 0, 24, 24);
  }
  return c.createPattern(tile, 'repeat');
}

function paintFog(state) {
  return (c, text, x, y) => {
    const cy = state.y * state.h;
    const depth = Math.abs(y) / (state.h * 0.5 + 1);
    c.save();
    c.globalAlpha = state.opacity * (0.35 + 0.65 * (1 - Math.min(1, depth)));
    c.fillStyle = state.color;
    c.fillText(text, x, y);
    c.restore();
  };
}

function offscreenText(state, drawText) {
  const layer = document.createElement('canvas');
  layer.width = state.w;
  layer.height = state.h;
  const lctx = layer.getContext('2d');
  drawText(lctx);
  return layer;
}

function applyReflection(ctx, state, drawText) {
  const layer = offscreenText(state, drawText);
  ctx.drawImage(layer, 0, 0);

  const cy = state.y * state.h;
  const refl = document.createElement('canvas');
  refl.width = state.w;
  refl.height = state.h;
  const rctx = refl.getContext('2d');
  rctx.translate(0, cy);
  rctx.scale(1, -0.55);
  rctx.translate(0, -cy);
  rctx.transform(1, 0, -0.18, 1, state.size * 0.35, 0);
  rctx.globalAlpha = 0.55;
  rctx.drawImage(layer, 0, 0);

  const fade = rctx.createLinearGradient(0, cy, 0, cy + state.size * 2.4);
  fade.addColorStop(0, 'rgba(0,0,0,0.55)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  rctx.globalCompositeOperation = 'destination-in';
  rctx.fillStyle = fade;
  rctx.fillRect(0, cy, state.w, state.h - cy);

  ctx.drawImage(refl, 0, 0);
}

function applyMelt(ctx, state, fg, drawText) {
  const layer = offscreenText(state, drawText);
  const lctx = layer.getContext('2d');
  if (fg) {
    lctx.save();
    lctx.globalCompositeOperation = 'destination-out';
    lctx.filter = `blur(${Math.max(6, state.size * 0.1)}px)`;
    lctx.drawImage(fg, 0, 0, state.w, state.h);
    lctx.restore();
  }
  ctx.drawImage(layer, 0, 0);
}

/** Shadow of text that lands only on the subject. */
function applyCastShadow(ctx, state, fg, drawText) {
  const layer = offscreenText(state, drawText);
  if (!fg) {
    ctx.drawImage(layer, 0, 0);
    return;
  }
  const lx = (state.lightX ?? 0.3) - 0.5;
  const ly = (state.lightY ?? 0.2) - 0.5;
  const ox = -lx * state.size * 0.9;
  const oy = -ly * state.size * 0.9 + state.size * 0.15;

  const shadow = document.createElement('canvas');
  shadow.width = state.w;
  shadow.height = state.h;
  const sctx = shadow.getContext('2d');
  sctx.filter = `blur(${Math.max(4, state.size * 0.12)}px)`;
  sctx.drawImage(layer, ox, oy);
  sctx.filter = 'none';
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = 'rgba(0,0,0,0.55)';
  sctx.fillRect(0, 0, state.w, state.h);
  // Keep shadow only on subject
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(fg, 0, 0, state.w, state.h);

  ctx.drawImage(shadow, 0, 0);
  ctx.drawImage(layer, 0, 0);
}

/** Behind color + on-subject color, split by silhouette. */
function applySplitColor(ctx, state, fg, mask, drawText) {
  const behindColor = state.color;
  const frontColor = state.color2 || '#ff4d6d';

  const back = { ...state, color: behindColor, finish: 'none' };
  const front = { ...state, color: frontColor, finish: 'none' };
  const paintB = paintBasic(back);
  const paintF = paintBasic(front);

  const backLayer = document.createElement('canvas');
  backLayer.width = state.w;
  backLayer.height = state.h;
  drawLayout(backLayer.getContext('2d'), back, mask, fg, paintB);

  const frontLayer = document.createElement('canvas');
  frontLayer.width = state.w;
  frontLayer.height = state.h;
  const fctx = frontLayer.getContext('2d');
  drawLayout(fctx, front, mask, fg, paintF);
  if (fg) {
    fctx.globalCompositeOperation = 'destination-in';
    fctx.drawImage(fg, 0, 0, state.w, state.h);
  }

  ctx.drawImage(backLayer, 0, 0);
  return frontLayer;
}

function applyChroma(ctx, state, drawText) {
  const layer = offscreenText(state, drawText);
  const split = Math.max(1, state.size * 0.04);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(tintLayer(layer, 'rgba(255,0,80,1)'), -split, 0);
  ctx.drawImage(tintLayer(layer, 'rgba(0,255,200,1)'), split, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.85;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function tintLayer(src, color) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

function applyNoise(ctx, state, time, drawText) {
  const layer = offscreenText(state, drawText);
  const lctx = layer.getContext('2d');
  const img = lctx.getImageData(0, 0, layer.width, layer.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 16) {
    if (d[i + 3] < 20) continue;
    const n = (Math.random() - 0.5) * 50;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  lctx.putImageData(img, 0, 0);
  ctx.drawImage(layer, 0, 0);
}

function applyMotion(ctx, state, drawText) {
  const layer = offscreenText(state, drawText);
  const steps = 10;
  const dx = state.size * 0.08;
  const dy = state.size * 0.02;
  ctx.save();
  for (let i = steps; i >= 0; i--) {
    ctx.globalAlpha = state.opacity * (0.08 + (1 - i / steps) * 0.35);
    ctx.drawImage(layer, -dx * i, -dy * i);
  }
  ctx.globalAlpha = state.opacity;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function applyWavy(ctx, state, time, drawText) {
  const layer = offscreenText(state, drawText);
  const amp = 5 + Math.sin(time / 280) * 3;
  const slice = 3;
  for (let y = 0; y < state.h; y += slice) {
    const dx = Math.sin(y * 0.05 + time / 250) * amp;
    ctx.drawImage(layer, 0, y, state.w, slice, dx, y, state.w, slice);
  }
}

function applyInk(ctx, state, time, drawText) {
  const layer = offscreenText(state, drawText);
  const lctx = layer.getContext('2d');
  lctx.globalCompositeOperation = 'source-atop';
  lctx.filter = `blur(${2 + Math.sin(time / 500) * 1.5}px)`;
  lctx.drawImage(layer, 1, 1);
  lctx.filter = 'none';
  // speckles
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = state.color;
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * state.w;
    const y = Math.random() * state.h;
    // only near opaque text — approximate with random and low alpha
    lctx.globalAlpha = 0.08;
    lctx.beginPath();
    lctx.arc(x, y, Math.random() * 2.5, 0, Math.PI * 2);
    lctx.fill();
  }
  ctx.drawImage(layer, 0, 0);
}

function applyGlass(ctx, state, time, drawText) {
  const layer = offscreenText(state, drawText);
  // Refract underlying photo through text mask
  const under = document.createElement('canvas');
  under.width = state.w;
  under.height = state.h;
  const uctx = under.getContext('2d');
  uctx.drawImage(ctx.canvas, 0, 0);
  const slice = 4;
  const warped = document.createElement('canvas');
  warped.width = state.w;
  warped.height = state.h;
  const wctx = warped.getContext('2d');
  for (let y = 0; y < state.h; y += slice) {
    const dx = Math.sin(y * 0.04 + time / 400) * 5;
    wctx.drawImage(under, 0, y, state.w, slice, dx, y, state.w, slice);
  }
  wctx.globalCompositeOperation = 'destination-in';
  wctx.drawImage(layer, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(warped, 0, 0);
  ctx.globalAlpha = 0.35;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function applyPaper(ctx, state, drawText) {
  const style = paperStyleFromFinish(state.finish);
  const p = { ...PAPER_DEFAULTS, ...(state.paper || {}) };
  const m = paperMetrics(state, p);

  ctx.save();
  ctx.translate(m.cx, m.cy);
  ctx.rotate((state.rotation * Math.PI) / 180);

  const layers = buildPaperLayers(style, m, p);
  // Back → front: each sheet casts a soft shadow, then the paper body.
  for (let i = 0; i < layers.length; i++) {
    drawPaperShadow(ctx, layers[i], p);
    drawPaperSheet(ctx, layers[i], p, style, i);
  }

  // Subject / text sits on the top sheet.
  ctx.restore();
  drawText(ctx);

  // Folds / rolls drawn in local paper space after text so they read on top.
  ctx.save();
  ctx.translate(m.cx, m.cy);
  ctx.rotate((state.rotation * Math.PI) / 180);
  if (style === 'folded' || (style === 'cut' && p.curl > 0.12)) drawFoldedCorners(ctx, m, p);
  if (style === 'rolled') drawRolledEdge(ctx, m, p);
  if (style === 'crumpled') drawCrumpleOverlay(ctx, m, p);
  ctx.restore();
}

function paperStyleFromFinish(finish) {
  if (finish === 'paperFolded') return 'folded';
  if (finish === 'paperRolled') return 'rolled';
  if (finish === 'paperCrumpled') return 'crumpled';
  if (finish === 'paperStack') return 'stack';
  return 'cut';
}

function paperMetrics(state, p) {
  const unit = wordUnit(state);
  const chars = Math.max(3, unit.length);
  const padX = state.size * (0.55 + p.thickness * 0.35);
  const padY = state.size * (0.55 + p.thickness * 0.25);
  let w = state.size * chars * 0.58 + padX * 2;
  let h = state.size * 1.55 + padY;
  // Keep the paper slab from swallowing the whole photo.
  w = Math.min(w, state.w * 0.82);
  h = Math.min(h, state.h * 0.55);
  return {
    cx: state.x * state.w,
    cy: state.y * state.h,
    w,
    h,
    depth: Math.max(4, state.size * 0.045 * (0.4 + p.thickness)),
  };
}

function buildPaperLayers(style, m, p) {
  const attach = (layer) => {
    layer._w = m.w;
    layer._h = m.h;
    return layer;
  };
  const layers = [];
  if (style === 'stack') {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const back = n - 1 - i; // 0 = front
      layers.push(attach({
        ox: -back * m.depth * 0.85 + Math.sin(i * 1.7) * m.depth * 0.15,
        oy: back * m.depth * 1.05 + Math.cos(i * 1.3) * m.depth * 0.1,
        scale: 1 + back * 0.012,
        rot: (i - n / 2) * 0.012,
        tintShift: -0.04 * back,
        tornMul: 0.55 + t * 0.5,
        z: back,
      }));
    }
    return layers;
  }

  // Classic 3-layer paper cut: back sheet, mid sheet, subject sheet.
  const d = m.depth;
  layers.push(attach({ ox: -d * 1.6, oy: d * 1.8, scale: 1.06, rot: -0.03, tintShift: -0.08, tornMul: 1.1, z: 2 }));
  layers.push(attach({ ox: -d * 0.7, oy: d * 0.85, scale: 1.03, rot: 0.02, tintShift: -0.04, tornMul: 0.9, z: 1 }));
  layers.push(attach({ ox: 0, oy: 0, scale: 1, rot: 0, tintShift: 0, tornMul: 1, z: 0 }));
  return layers;
}

function paperHash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function tornRectPath(ctx, w, h, tornAmt, seed, crumpled = false) {
  const steps = Math.max(12, Math.round(28 + tornAmt * 24));
  const amp = Math.min(w, h) * 0.028 * tornAmt * (crumpled ? 1.8 : 1);
  const crumple = crumpled ? Math.min(w, h) * 0.04 : 0;

  const edge = (side, t, i) => {
    const n = paperHash(seed + side * 17, i * 3.1) - 0.5;
    const n2 = paperHash(seed + side * 9.1, i * 7.7) - 0.5;
    return n * amp * 2 + n2 * crumple;
  };

  ctx.beginPath();
  // Top edge L→R
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = -w / 2 + t * w;
    const y = -h / 2 + edge(0, t, i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  // Right edge T→B
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = w / 2 + edge(1, t, i);
    const y = -h / 2 + t * h;
    ctx.lineTo(x, y);
  }
  // Bottom edge R→L
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = w / 2 - t * w;
    const y = h / 2 + edge(2, t, i);
    ctx.lineTo(x, y);
  }
  // Left edge B→T
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = -w / 2 + edge(3, t, i);
    const y = h / 2 - t * h;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function paperTint(hex, shift) {
  return shade(hex, shift);
}

function drawPaperShadow(ctx, layer, p) {
  const soft = 8 + p.shadowSoft * 22;
  ctx.save();
  ctx.translate(layer.ox + 2, layer.oy + 4 + p.thickness * 3);
  ctx.rotate(layer.rot);
  ctx.scale(layer.scale, layer.scale);
  // Near-invisible fill so only the blurred shadow is seen (opaque black
  // fills were reading as jagged black tears on the photo).
  ctx.fillStyle = 'rgba(0,0,0,0.015)';
  ctx.shadowColor = `rgba(0,0,0,${0.28 + p.shadowSoft * 0.32})`;
  ctx.shadowBlur = soft;
  ctx.shadowOffsetX = 1 + p.thickness * 2;
  ctx.shadowOffsetY = 3 + p.thickness * 5;
  tornRectPath(ctx, layer._w, layer._h, p.torn * layer.tornMul * 0.55, 3 + layer.z * 7, false);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}

function fillPaperTexture(ctx, w, h, p, seed) {
  if (p.texture < 0.02) return;
  // Procedural fiber dots — cheap and reads as paper stock.
  ctx.save();
  ctx.globalAlpha = 0.08 + p.texture * 0.18;
  for (let i = 0; i < 180 + p.texture * 220; i++) {
    const u = paperHash(seed, i);
    const v = paperHash(seed + 3.1, i * 1.7);
    const x = -w / 2 + u * w;
    const y = -h / 2 + v * h;
    const bright = paperHash(seed + 9, i) > 0.55;
    ctx.fillStyle = bright ? 'rgba(255,255,255,0.55)' : 'rgba(80,55,30,0.45)';
    ctx.fillRect(x, y, 1 + (i % 2), 1);
  }
  // Subtle fiber lines
  ctx.globalAlpha = 0.04 + p.texture * 0.08;
  ctx.strokeStyle = 'rgba(90,60,30,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12 + p.texture * 16; i++) {
    const y = -h / 2 + paperHash(seed + 20, i) * h;
    ctx.beginPath();
    ctx.moveTo(-w / 2, y);
    for (let x = 0; x <= 8; x++) {
      const xx = -w / 2 + (x / 8) * w;
      ctx.lineTo(xx, y + (paperHash(seed + x, i) - 0.5) * 3);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPaperSheet(ctx, layer, p, style, index) {
  const w = layer._w;
  const h = layer._h;
  const crumpled = style === 'crumpled';
  const tint = paperTint(p.tint, layer.tintShift);

  ctx.save();
  ctx.translate(layer.ox, layer.oy);
  ctx.rotate(layer.rot);
  ctx.scale(layer.scale, layer.scale);

  // Body
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  tornRectPath(ctx, w, h, p.torn * layer.tornMul, 11 + index * 13, crumpled);
  ctx.fillStyle = tint;
  ctx.fill();

  // Clip further decorations to the sheet
  ctx.save();
  tornRectPath(ctx, w, h, p.torn * layer.tornMul, 11 + index * 13, crumpled);
  ctx.clip();

  fillPaperTexture(ctx, w, h, p, 40 + index * 5);

  // Bevel: light top-left, dark bottom-right edge strip
  const bevelW = Math.max(2, Math.min(w, h) * 0.03 * (0.4 + p.bevel));
  const g1 = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2 + bevelW * 6, -h / 2 + bevelW * 6);
  g1.addColorStop(0, `rgba(255,255,255,${0.15 + p.bevel * 0.35})`);
  g1.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  const g2 = ctx.createLinearGradient(w / 2, h / 2, w / 2 - bevelW * 7, h / 2 - bevelW * 7);
  g2.addColorStop(0, `rgba(60,40,20,${0.12 + p.bevel * 0.28})`);
  g2.addColorStop(1, 'rgba(60,40,20,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Thickness edge band on bottom + right (reads as paper depth)
  if (p.thickness > 0.08 && layer.z === 0) {
    ctx.fillStyle = shade(p.tint, -0.18 - p.thickness * 0.12);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-w / 2, h / 2 - 1, w, 2 + p.thickness * 5);
    ctx.fillRect(w / 2 - 1, -h / 2, 2 + p.thickness * 4, h);
    ctx.globalAlpha = 1;
  }

  if (crumpled) {
    ctx.globalAlpha = 0.12 + p.texture * 0.1;
    ctx.strokeStyle = 'rgba(40,25,10,0.55)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const x0 = -w / 2 + paperHash(70, i) * w;
      const y0 = -h / 2 + paperHash(71, i) * h;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(
        x0 + (paperHash(72, i) - 0.5) * w * 0.3,
        y0 + (paperHash(73, i) - 0.5) * h * 0.3,
        x0 + (paperHash(74, i) - 0.5) * w * 0.45,
        y0 + (paperHash(75, i) - 0.5) * h * 0.4
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // clip
  ctx.restore();
}

function drawFoldedCorners(ctx, m, p) {
  const w = m.w;
  const h = m.h;
  const curl = 0.12 + p.curl * 0.22;
  const corners = [
    { x: -w / 2, y: -h / 2, dx: 1, dy: 1 },   // TL folds toward center
    { x: w / 2, y: -h / 2, dx: -1, dy: 1 },
    { x: w / 2, y: h / 2, dx: -1, dy: -1 },
    { x: -w / 2, y: h / 2, dx: 1, dy: -1 },
  ];
  const size = Math.min(w, h) * curl;

  corners.forEach((c, i) => {
    if (p.curl < 0.08 && i > 0) return;
    // Shadow under fold
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.dx * size, c.y);
    ctx.lineTo(c.x, c.y + c.dy * size);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fill();

    // Fold flap (underside — slightly lighter / cooler)
    ctx.beginPath();
    ctx.moveTo(c.x + c.dx * size * 0.08, c.y + c.dy * size * 0.08);
    ctx.lineTo(c.x + c.dx * size, c.y);
    ctx.lineTo(c.x, c.y + c.dy * size);
    ctx.closePath();
    const ug = ctx.createLinearGradient(c.x, c.y, c.x + c.dx * size, c.y + c.dy * size);
    ug.addColorStop(0, shade(p.tint, 0.18));
    ug.addColorStop(1, shade(p.tint, -0.05));
    ctx.fillStyle = ug;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });
}

function drawRolledEdge(ctx, m, p) {
  // Peeled-sticker roll along the right edge
  const w = m.w;
  const h = m.h;
  const rollR = Math.min(w, h) * (0.08 + p.curl * 0.14);
  const x0 = w / 2 - rollR * 0.2;

  ctx.save();
  // Cast shadow of the peel
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x0 + rollR * 0.6, 0, rollR * 0.9, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cylinder body
  const g = ctx.createLinearGradient(x0 - rollR, 0, x0 + rollR * 1.4, 0);
  g.addColorStop(0, shade(p.tint, -0.15));
  g.addColorStop(0.35, shade(p.tint, 0.12));
  g.addColorStop(0.55, shade(p.tint, -0.08));
  g.addColorStop(0.8, shade(p.tint, 0.18));
  g.addColorStop(1, shade(p.tint, -0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.rect(x0, -h / 2 + 4, rollR * 1.35, h - 8);
  ctx.fill();

  // Inner curl lip
  ctx.beginPath();
  ctx.ellipse(x0 + rollR * 0.15, 0, rollR * 0.35, h * 0.46, 0, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCrumpleOverlay(ctx, m, p) {
  // Soft displacement shading — reads as crumpled relief
  const w = m.w;
  const h = m.h;
  ctx.save();
  ctx.globalAlpha = 0.14 + p.texture * 0.12;
  for (let i = 0; i < 26; i++) {
    const cx = -w / 2 + paperHash(90, i) * w;
    const cy = -h / 2 + paperHash(91, i) * h;
    const rw = w * (0.08 + paperHash(92, i) * 0.18);
    const rh = h * (0.06 + paperHash(93, i) * 0.14);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rw, rh));
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, paperHash(94, i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function applySweep(ctx, state, time, drawText) {
  const off = offscreenText(state, drawText);
  ctx.drawImage(off, 0, 0);
  const t = (time / 1800) % 1;
  const x = -state.w * 0.3 + t * state.w * 1.6;
  const g = ctx.createLinearGradient(x, 0, x + state.w * 0.25, state.h * 0.2);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  const hi = document.createElement('canvas');
  hi.width = state.w;
  hi.height = state.h;
  const hctx = hi.getContext('2d');
  hctx.fillStyle = g;
  hctx.fillRect(0, 0, state.w, state.h);
  hctx.globalCompositeOperation = 'destination-in';
  hctx.drawImage(off, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(hi, 0, 0);
  ctx.restore();
}

function applyParticles(ctx, state, time, drawText) {
  drawText(ctx);
  const cx = state.x * state.w;
  const cy = state.y * state.h;
  ctx.save();
  for (let i = 0; i < 48; i++) {
    const seed = i * 97.13;
    const ang = seed + time / 900 + i;
    const rad = state.size * (0.7 + (i % 7) * 0.18) + Math.sin(time / 500 + i) * 6;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang * 1.3) * rad * 0.65;
    ctx.globalAlpha = 0.25 + (i % 5) * 0.08;
    ctx.fillStyle = state.color;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function applySmoke(ctx, state, time, drawText) {
  const off = offscreenText(state, drawText);
  const slice = 4;
  for (let x = 0; x < state.w; x += slice) {
    const n = Math.sin(x * 0.03 + time / 400) * 8 + Math.sin(x * 0.01 - time / 700) * 12;
    ctx.save();
    ctx.globalAlpha = state.opacity * (0.75 + 0.25 * Math.sin(time / 600 + x * 0.02));
    ctx.drawImage(off, x, 0, slice, state.h, x, n, slice, state.h);
    ctx.restore();
  }
}

function applyLiquid(ctx, state, fg, time, drawText) {
  const textLayer = offscreenText(state, drawText);
  const amp = 6 + Math.sin(time / 500) * 2;
  const slice = 3;
  for (let y = 0; y < state.h; y += slice) {
    const dx = Math.sin(y * 0.045 + time / 350) * amp + Math.sin(y * 0.01) * 3;
    ctx.drawImage(textLayer, 0, y, state.w, slice, dx, y, state.w, slice);
  }
}

/**
 * Draw sticker stroke + shadow for the subject cutout.
 */
export function drawStickerSubject(ctx, fg, w, h, opts = {}) {
  if (!fg) return;
  const pad = Math.max(4, opts.border ?? 10);
  const color = opts.borderColor || '#ffffff';

  // Expand the cutout into a white ring by stamping offsets (no CSS filter —
  // canvas filter blur has triggered GPU/compositor glitches on some browsers).
  const ring = document.createElement('canvas');
  ring.width = w;
  ring.height = h;
  const r = ring.getContext('2d');
  r.drawImage(fg, 0, 0, w, h);
  r.globalCompositeOperation = 'source-in';
  r.fillStyle = color;
  r.fillRect(0, 0, w, h);
  r.globalCompositeOperation = 'source-over';

  const stamp = document.createElement('canvas');
  stamp.width = w;
  stamp.height = h;
  const s = stamp.getContext('2d');
  for (let dy = -pad; dy <= pad; dy++) {
    for (let dx = -pad; dx <= pad; dx++) {
      if (dx * dx + dy * dy > pad * pad) continue;
      s.drawImage(ring, dx, dy);
    }
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(stamp, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(fg, 0, 0, w, h);
  ctx.restore();
}

export const SUBJECT_EFFECTS = [
  { id: 'none', label: 'Normal subject' },
  { id: 'paper', label: 'Paper cut' },
  { id: 'paperFolded', label: 'Folded' },
  { id: 'paperRolled', label: 'Rolled' },
  { id: 'paperCrumpled', label: 'Crumpled' },
  { id: 'paperStack', label: 'Paper stack' },
];

export function isSubjectPaperEffect(id) {
  return id && id !== 'none' && String(id).startsWith('paper');
}

function subjectPaperStyle(id) {
  if (id === 'paperFolded') return 'folded';
  if (id === 'paperRolled') return 'rolled';
  if (id === 'paperCrumpled') return 'crumpled';
  if (id === 'paperStack') return 'stack';
  return 'cut';
}

function makeSilhouetteFill(fg, w, h, color) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.drawImage(fg, 0, 0, w, h);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, w, h);
  return c;
}

function expandSilhouette(src, w, h, pad) {
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const x = out.getContext('2d');
  const step = Math.max(1, Math.round(pad / 5));
  for (let dy = -pad; dy <= pad; dy += step) {
    for (let dx = -pad; dx <= pad; dx += step) {
      if (dx * dx + dy * dy > pad * pad) continue;
      x.drawImage(src, dx, dy);
    }
  }
  return out;
}

function biteTornEdges(canvas, tornAmt, seed) {
  if (tornAmt < 0.05) return canvas;
  const w = canvas.width;
  const h = canvas.height;
  const x = canvas.getContext('2d');
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  const bites = Math.round(40 + tornAmt * 120);
  for (let i = 0; i < bites; i++) {
    // Pick a random opaque pixel near an edge (has transparent neighbor)
    const px = Math.floor(paperHash(seed, i) * w);
    const py = Math.floor(paperHash(seed + 2.1, i) * h);
    const idx = (py * w + px) * 4 + 3;
    if (d[idx] < 128) continue;
    let edge = false;
    for (let oy = -2; oy <= 2 && !edge; oy++) {
      for (let ox = -2; ox <= 2; ox++) {
        const xx = px + ox;
        const yy = py + oy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) { edge = true; break; }
        if (d[(yy * w + xx) * 4 + 3] < 40) { edge = true; break; }
      }
    }
    if (!edge) continue;
    const rad = 1 + Math.floor(paperHash(seed + 5, i) * (2 + tornAmt * 7));
    x.save();
    x.globalCompositeOperation = 'destination-out';
    x.fillStyle = '#000';
    x.beginPath();
    // Irregular bite
    const spikes = 5 + (i % 4);
    for (let s = 0; s <= spikes; s++) {
      const a = (s / spikes) * Math.PI * 2;
      const jitter = 0.55 + paperHash(seed + s, i) * 0.7;
      const rr = rad * jitter;
      const bx = px + Math.cos(a) * rr;
      const by = py + Math.sin(a) * rr;
      if (s === 0) x.moveTo(bx, by);
      else x.lineTo(bx, by);
    }
    x.closePath();
    x.fill();
    x.restore();
  }
  return canvas;
}

export function subjectBounds(fg, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.drawImage(fg, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  let minX = w; let minY = h; let maxX = 0; let maxY = 0; let found = false;
  for (let y = 0; y < h; y += 2) {
    for (let px = 0; px < w; px += 2) {
      if (d[(y * w + px) * 4 + 3] > 20) {
        found = true;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return { x: 0, y: 0, w, h };
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

/**
 * Paper-cut treatment for the subject silhouette (not the text slab).
 * Layer stack + shadow under the person, optional torn rim / folds / roll / crumple.
 */
export function drawSubjectPaper(ctx, fg, w, h, state) {
  if (!fg) return;
  const style = subjectPaperStyle(state.subjectEffect);
  const p = { ...PAPER_DEFAULTS, ...(state.subjectPaper || state.paper || {}) };
  const tint = p.tint || '#f3ead7';
  const depth = Math.max(3, Math.min(w, h) * 0.012 * (0.35 + p.thickness));
  const soft = 8 + p.shadowSoft * 28;
  const border = Math.max(3, Math.round(Math.min(w, h) * 0.01 * (0.5 + p.thickness + p.bevel)));

  const fill = makeSilhouetteFill(fg, w, h, tint);
  const darkFill = makeSilhouetteFill(fg, w, h, shade(tint, -0.14));

  const layerCount = style === 'stack' ? 10 : 3;
  // Back → front paper body layers (silhouette shaped)
  for (let i = layerCount - 1; i >= 1; i--) {
    const t = i / (layerCount - 1);
    const ox = -depth * i * 0.85 + Math.sin(i * 1.4) * depth * 0.12;
    const oy = depth * i * 1.05 + Math.cos(i * 1.1) * depth * 0.1;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = `rgba(0,0,0,${0.18 + p.shadowSoft * 0.2})`;
    ctx.shadowBlur = soft * (0.45 + t * 0.3);
    ctx.shadowOffsetX = 1 + p.thickness * 2;
    ctx.shadowOffsetY = 2 + p.thickness * 4;
    ctx.drawImage(i % 2 ? darkFill : fill, ox, oy);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Soft contact shadow under the real subject
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${0.35 + p.shadowSoft * 0.35})`;
  ctx.shadowBlur = soft;
  ctx.shadowOffsetX = 2 + p.thickness * 3;
  ctx.shadowOffsetY = 6 + p.thickness * 8;
  ctx.globalAlpha = 0.9;
  ctx.drawImage(darkFill, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();

  // Paper rim / thickness ring around the subject
  let rim = expandSilhouette(fill, w, h, border + Math.round(p.torn * 6));
  if (p.torn > 0.05) rim = biteTornEdges(rim, p.torn, 19);
  ctx.drawImage(rim, 0, 0);

  // Optional bevel highlight along the expanded rim edge
  if (p.bevel > 0.05) {
    const hi = expandSilhouette(fill, w, h, Math.max(2, Math.round(border * 0.55)));
    const hx = hi.getContext('2d');
    hx.globalCompositeOperation = 'source-in';
    const g = hx.createLinearGradient(0, 0, w * 0.35, h * 0.35);
    g.addColorStop(0, `rgba(255,255,255,${0.2 + p.bevel * 0.35})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    hx.fillStyle = g;
    hx.fillRect(0, 0, w, h);
    // Punch inner subject so only a rim highlight remains
    hx.globalCompositeOperation = 'destination-out';
    hx.drawImage(fg, 1, 1, w, h);
    ctx.drawImage(hi, 0, 0);
  }

  // Subject photo on top
  if (style === 'crumpled') {
    drawCrumpledSubject(ctx, fg, w, h, p);
  } else {
    ctx.drawImage(fg, 0, 0, w, h);
  }

  // Subtle paper fiber wash over the subject
  if (p.texture > 0.05) {
    ctx.save();
    ctx.globalAlpha = 0.06 + p.texture * 0.1;
    ctx.globalCompositeOperation = 'soft-light';
    const wash = makeSilhouetteFill(fg, w, h, '#fff8e8');
    // speckles
    const wx = wash.getContext('2d');
    wx.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 80 + p.texture * 120; i++) {
      wx.fillStyle = paperHash(40, i) > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(90,60,30,0.35)';
      wx.fillRect(paperHash(41, i) * w, paperHash(42, i) * h, 1, 1);
    }
    ctx.drawImage(wash, 0, 0);
    ctx.restore();
  }

  const bounds = subjectBounds(fg, w, h);
  if (style === 'folded' || (style === 'cut' && p.curl > 0.15)) {
    drawClippedOverlay(ctx, fg, w, h, (x) => drawSubjectFolds(x, bounds, p));
  }
  if (style === 'rolled') {
    drawClippedOverlay(ctx, fg, w, h, (x) => drawSubjectRoll(x, bounds, p, tint));
  }
}

/** Draw overlay only where the subject alpha is opaque. */
function drawClippedOverlay(ctx, fg, w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  paint(x);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(fg, 0, 0, w, h);
  ctx.drawImage(c, 0, 0);
}

function drawCrumpledSubject(ctx, fg, w, h, p) {
  const slice = 4;
  for (let y = 0; y < h; y += slice) {
    const n = (paperHash(55, y) - 0.5) * (6 + p.torn * 14) + (paperHash(56, y * 0.3) - 0.5) * 8;
    ctx.drawImage(fg, 0, y, w, slice, n * 0.35, y + n * 0.15, w, slice);
  }
}

function drawSubjectFolds(ctx, b, p) {
  const curl = Math.min(b.w, b.h) * (0.1 + p.curl * 0.18);
  const corners = [
    { x: b.x, y: b.y, dx: 1, dy: 1 },
    { x: b.x + b.w, y: b.y, dx: -1, dy: 1 },
    { x: b.x + b.w, y: b.y + b.h, dx: -1, dy: -1 },
    { x: b.x, y: b.y + b.h, dx: 1, dy: -1 },
  ];
  corners.forEach((c) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.dx * curl, c.y);
    ctx.lineTo(c.x, c.y + c.dy * curl);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c.x + c.dx * 2, c.y + c.dy * 2);
    ctx.lineTo(c.x + c.dx * curl, c.y);
    ctx.lineTo(c.x, c.y + c.dy * curl);
    ctx.closePath();
    const g = ctx.createLinearGradient(c.x, c.y, c.x + c.dx * curl, c.y + c.dy * curl);
    g.addColorStop(0, shade(p.tint || '#f3ead7', 0.2));
    g.addColorStop(1, shade(p.tint || '#f3ead7', -0.05));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  });
}

function drawSubjectRoll(ctx, b, p, tint) {
  const rollR = Math.min(b.w, b.h) * (0.08 + p.curl * 0.12);
  const x0 = b.x + b.w - rollR * 1.1;
  const cy = b.y + b.h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(x0 + rollR * 0.5, cy, rollR * 0.85, b.h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x0 - rollR, cy, x0 + rollR * 1.3, cy);
  g.addColorStop(0, shade(tint, -0.12));
  g.addColorStop(0.4, shade(tint, 0.14));
  g.addColorStop(0.7, shade(tint, -0.06));
  g.addColorStop(1, shade(tint, 0.1));
  ctx.fillStyle = g;
  ctx.fillRect(x0, b.y + 4, rollR * 1.25, b.h - 8);
  ctx.restore();
}

/**
 * Draw the text effect layer onto ctx (photo already drawn).
 * Returns compositing hints for the caller.
 */
export function drawTextEffects(ctx, state, { fg, mask, behind, time }) {
  state._mask = mask;
  const paint = choosePaint(state, time);
  const drawText = (target) => {
    if (state.layout === 'broken' || state.finish === 'explosion' || state.finish === 'kinetic') {
      drawBroken(target, state, paint, time);
    } else {
      drawLayout(target, state, mask, fg, paint);
    }
  };

  const finish = state.finish;
  let splitFront = null;
  const blend = state.blend || 'source-over';

  ctx.save();
  if (blend !== 'source-over') ctx.globalCompositeOperation = blend;

  if (finish === 'reflect') applyReflection(ctx, state, drawText);
  else if (finish === 'melt') applyMelt(ctx, state, fg, drawText);
  else if (finish === 'castShadow') applyCastShadow(ctx, state, fg, drawText);
  else if (finish === 'splitColor') splitFront = applySplitColor(ctx, state, fg, mask, drawText);
  else if (finish === 'chroma') applyChroma(ctx, state, drawText);
  else if (finish === 'noise') applyNoise(ctx, state, time, drawText);
  else if (finish === 'motion') applyMotion(ctx, state, drawText);
  else if (finish === 'wavy') applyWavy(ctx, state, time, drawText);
  else if (finish === 'ink') applyInk(ctx, state, time, drawText);
  else if (finish === 'glass') applyGlass(ctx, state, time, drawText);
  else if (isPaperFinish(finish)) applyPaper(ctx, state, drawText);
  else if (finish === 'sweep') applySweep(ctx, state, time, drawText);
  else if (finish === 'particles') applyParticles(ctx, state, time, drawText);
  else if (finish === 'smoke') applySmoke(ctx, state, time, drawText);
  else if (finish === 'liquid') applyLiquid(ctx, state, fg, time, drawText);
  else if (finish === 'explosion' || finish === 'kinetic') drawBroken(ctx, state, paint, time);
  else if (isComponentryAnimFinish(finish)) applyComponentryAnim(ctx, state, paint, time, finish);
  else drawText(ctx);

  ctx.restore();

  return {
    drawCutout: !!(behind && fg) || finish === 'splitColor' || finish === 'castShadow',
    splitFront,
    sticker: !!state.sticker,
    breakout: !!state.breakout,
  };
}

/* ========================================================================
 * Componentry-inspired text animations — canvas ports of concepts from
 * https://github.com/harshjdhv/componentry (React/Framer Motion originals).
 * ======================================================================== */

const HYPER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$.,!?:;+-=%&#@';

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function easeOutBack(t) {
  const c = 1.70158;
  const t1 = t - 1;
  return 1 + (c + 1) * t1 ** 3 + c * t1 ** 2;
}

function loopWave(time, periodMs, stagger, index) {
  const t = ((time - index * stagger * periodMs) / periodMs) % 1;
  return t < 0 ? t + 1 : t;
}

/** Per-glyph slots for multiline centered text in local (rotated) space. */
function glyphSlots(c, state) {
  applyFont(c, state);
  const lines = (state.text || 'TEXT').split('\n');
  const lh = state.size * state.lineHeight;
  const total = lh * (lines.length - 1);
  const slots = [];
  let gi = 0;
  lines.forEach((line, li) => {
    const chars = Array.from(line);
    if (!chars.length) return;
    const widths = chars.map((ch) => c.measureText(ch === ' ' ? '·' : ch).width + state.letterSpacing);
    const lineW = widths.reduce((a, b) => a + b, 0);
    let x = -lineW / 2;
    const y = li * lh - total / 2;
    chars.forEach((ch, ci) => {
      const w = widths[ci];
      slots.push({
        g: ch,
        x: x + w / 2,
        y,
        w,
        i: gi++,
        line: li,
        space: /\s/.test(ch),
      });
      x += w;
    });
  });
  return slots;
}

function withTextOrigin(c, state, fn) {
  c.save();
  c.translate(state.x * state.w, state.y * state.h);
  c.rotate((state.rotation * Math.PI) / 180);
  c.globalAlpha = state.opacity;
  applyFont(c, state);
  fn();
  c.restore();
}

function pointerInTextSpace(state) {
  const px = (state.pointerX ?? 0.5) * state.w;
  const py = (state.pointerY ?? 0.5) * state.h;
  const ox = state.x * state.w;
  const oy = state.y * state.h;
  const r = (-state.rotation * Math.PI) / 180;
  const dx = px - ox;
  const dy = py - oy;
  return {
    x: dx * Math.cos(r) - dy * Math.sin(r),
    y: dx * Math.sin(r) + dy * Math.cos(r),
  };
}

function paintGlyphAt(c, paint, g, x, y) {
  if (!g || /\s/.test(g)) return;
  paint(c, g, x, y);
}

function applyComponentryAnim(ctx, state, paint, time, finish) {
  switch (finish) {
    case 'kineticReveal':
      return drawKineticReveal(ctx, state, paint, time);
    case 'letterCascade':
      return drawLetterCascade(ctx, state, paint, time);
    case 'hyperText':
      return drawHyperText(ctx, state, paint, time);
    case 'splitFlap':
      return drawSplitFlap(ctx, state, paint, time);
    case 'textRepel':
      return drawTextRepel(ctx, state, paint);
    case 'marquee':
      return drawMarquee(ctx, state, paint, time);
    case 'blurReveal':
      return drawBlurReveal(ctx, state, paint, time);
    case 'slideReveal':
      return drawSlideReveal(ctx, state, paint, time);
    case 'scalePop':
      return drawScalePop(ctx, state, paint, time);
    case 'signature':
      return drawSignature(ctx, state, time);
    default:
      drawSingle(ctx, state, paint);
  }
}

/** Staggered slide-up / fade reveal (kinetic-text-reveal). */
function drawKineticReveal(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 2200;
    const dist = state.size * 0.55;
    for (const s of slots) {
      if (s.space) continue;
      const t = loopWave(time, period, 0.045, s.i);
      // Hold visible in the middle of the loop
      let p;
      if (t < 0.35) p = easeOutCubic(t / 0.35);
      else if (t < 0.75) p = 1;
      else p = 1 - easeOutCubic((t - 0.75) / 0.25);
      ctx.save();
      ctx.globalAlpha = state.opacity * p;
      ctx.translate(s.x, s.y + dist * (1 - p));
      paintGlyphAt(ctx, paint, s.g, 0, 0);
      ctx.restore();
    }
  });
}

/** Flip-cascade per letter (letter-cascade). */
function drawLetterCascade(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 2400;
    for (const s of slots) {
      if (s.space) continue;
      const t = loopWave(time, period, 0.05, s.i);
      // 0→0.5: front flips away; 0.5→1: echo lands
      let scaleY = 1;
      let dy = 0;
      let alpha = 1;
      if (t < 0.45) {
        const u = easeOutCubic(t / 0.45);
        scaleY = Math.cos(u * Math.PI / 2);
        dy = -state.size * 0.08 * u;
        alpha = 1 - u * 0.35;
      } else if (t < 0.55) {
        scaleY = 0.05;
        alpha = 0.2;
      } else {
        const u = easeOutBack(Math.min(1, (t - 0.55) / 0.45));
        scaleY = Math.sin(u * Math.PI / 2);
        dy = state.size * 0.1 * (1 - u);
        alpha = 0.4 + 0.6 * u;
      }
      ctx.save();
      ctx.globalAlpha = state.opacity * Math.max(0.05, alpha);
      ctx.translate(s.x, s.y + dy);
      ctx.scale(1, Math.max(0.08, scaleY));
      paintGlyphAt(ctx, paint, s.g, 0, 0);
      ctx.restore();
    }
  });
}

/** Cyberpunk scramble → reveal (hyper-text). */
function drawHyperText(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 2800;
    const cycle = (time % period) / period;
    const reveal = Math.min(1, cycle / 0.7) * slots.length;
    for (const s of slots) {
      if (s.space) continue;
      let ch = s.g;
      if (s.i > reveal) {
        const seed = Math.floor(time / 40 + s.i * 7.3);
        ch = HYPER_ALPHABET[seed % HYPER_ALPHABET.length];
      } else if (s.i > reveal - 1.5) {
        const seed = Math.floor(time / 30 + s.i * 3.1);
        ch = HYPER_ALPHABET[seed % HYPER_ALPHABET.length];
      }
      ctx.save();
      ctx.translate(s.x, s.y);
      paintGlyphAt(ctx, paint, ch, 0, 0);
      ctx.restore();
    }
  });
}

/** Airport-board flip through charset (split-flap-display). */
function drawSplitFlap(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 3200;
    const flipSpeed = 55;
    for (const s of slots) {
      if (s.space) continue;
      const start = s.i * 90;
      const elapsed = Math.max(0, (time % period) - start);
      const target = (s.g || ' ').toUpperCase();
      const targetIdx = Math.max(0, FLAP_CHARS.indexOf(target));
      const steps = Math.min(targetIdx + FLAP_CHARS.length, Math.floor(elapsed / flipSpeed));
      const ch = FLAP_CHARS[steps % FLAP_CHARS.length] || target;
      const flipping = steps < targetIdx && (time % period) < period * 0.85;
      const flipPhase = flipping ? ((elapsed / flipSpeed) % 1) : 0;
      ctx.save();
      ctx.translate(s.x, s.y);
      if (flipping) {
        ctx.scale(1, Math.max(0.15, Math.cos(flipPhase * Math.PI)));
      }
      // Cell plate
      const cellW = Math.max(s.w, state.size * 0.55);
      const cellH = state.size * 0.95;
      ctx.fillStyle = 'rgba(20,18,14,0.55)';
      ctx.fillRect(-cellW / 2, -cellH / 2, cellW, cellH);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(-cellW / 2 + 0.5, -cellH / 2 + 0.5, cellW - 1, cellH - 1);
      ctx.beginPath();
      ctx.moveTo(-cellW / 2, 0);
      ctx.lineTo(cellW / 2, 0);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.stroke();
      paintGlyphAt(ctx, paint, ch === ' ' ? target : ch, 0, 0);
      ctx.restore();
    }
  });
}

/** Cursor pushes / pulls letters (text-repel). */
function drawTextRepel(ctx, state, paint) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const mouse = pointerInTextSpace(state);
    const radius = state.size * 2.8;
    const strength = state.size * 0.85;
    for (const s of slots) {
      if (s.space) continue;
      const dx = s.x - mouse.x;
      const dy = s.y - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      let ox = 0;
      let oy = 0;
      let rot = 0;
      if (dist < radius) {
        const force = ((1 - dist / radius) ** 2) * strength;
        ox = (dx / dist) * force;
        oy = (dy / dist) * force;
        rot = ox * 0.004;
      }
      ctx.save();
      ctx.translate(s.x + ox, s.y + oy);
      ctx.rotate(rot);
      paintGlyphAt(ctx, paint, s.g, 0, 0);
      ctx.restore();
    }
  });
}

/** Horizontal velocity marquee (scroll-based-velocity). */
function drawMarquee(ctx, state, paint, time) {
  const phrase = (state.text || 'TEXT').replace(/\n+/g, ' ').trim() || 'TEXT';
  applyFont(ctx, state);
  const gap = state.size * 0.8;
  const unitW = ctx.measureText(phrase).width + gap;
  const speed = state.size * 0.9;
  const offset = -((time / 1000) * speed) % unitW;
  ctx.save();
  ctx.translate(0, state.y * state.h);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.globalAlpha = state.opacity;
  applyFont(ctx, state);
  const y = 0;
  const startX = offset - unitW;
  for (let x = startX; x < state.w + unitW; x += unitW) {
    paint(ctx, phrase, x + unitW / 2, y);
  }
  ctx.restore();
}

/** Blur + rise stagger (text-animate blurInUp). */
function drawBlurReveal(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 2400;
    for (const s of slots) {
      if (s.space) continue;
      const t = loopWave(time, period, 0.05, s.i);
      let p;
      if (t < 0.4) p = easeOutCubic(t / 0.4);
      else if (t < 0.7) p = 1;
      else p = 1 - easeOutCubic((t - 0.7) / 0.3);
      const blur = (1 - p) * Math.min(12, state.size * 0.08);
      ctx.save();
      ctx.globalAlpha = state.opacity * Math.max(0.05, p);
      ctx.filter = blur > 0.4 ? `blur(${blur}px)` : 'none';
      ctx.translate(s.x, s.y + (1 - p) * state.size * 0.35);
      paintGlyphAt(ctx, paint, s.g, 0, 0);
      ctx.restore();
    }
    ctx.filter = 'none';
  });
}

/** Alternating slide-in (text-animate slideLeft/Right). */
function drawSlideReveal(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 2300;
    const dist = state.size * 0.9;
    for (const s of slots) {
      if (s.space) continue;
      const t = loopWave(time, period, 0.04, s.i);
      let p;
      if (t < 0.4) p = easeOutCubic(t / 0.4);
      else if (t < 0.72) p = 1;
      else p = 1 - easeOutCubic((t - 0.72) / 0.28);
      const dir = s.i % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.globalAlpha = state.opacity * p;
      ctx.translate(s.x + dir * dist * (1 - p), s.y);
      paintGlyphAt(ctx, paint, s.g, 0, 0);
      ctx.restore();
    }
  });
}

/** Scale-up pop stagger (text-animate scaleUp). */
function drawScalePop(ctx, state, paint, time) {
  withTextOrigin(ctx, state, () => {
    const slots = glyphSlots(ctx, state);
    const period = 2100;
    for (const s of slots) {
      if (s.space) continue;
      const t = loopWave(time, period, 0.048, s.i);
      let p;
      if (t < 0.4) p = easeOutBack(t / 0.4);
      else if (t < 0.7) p = 1;
      else p = 1 - easeOutCubic((t - 0.7) / 0.3);
      const scale = 0.35 + 0.65 * p;
      ctx.save();
      ctx.globalAlpha = state.opacity * Math.max(0.05, p);
      ctx.translate(s.x, s.y);
      ctx.scale(scale, scale);
      paintGlyphAt(ctx, paint, s.g, 0, 0);
      ctx.restore();
    }
  });
}

/* ---------- Signature (Componentry / Opentype path draw) ---------- */

const SIGNATURE_FONT_URLS = [
  'https://componentry.dev/LastoriaBoldRegular.otf',
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/greatvibes/GreatVibes-Regular.ttf',
];

let signatureFontPromise = null;
let signatureRedraw = null;
const signatureCache = { key: '', glyphs: null, failed: false, loadingKey: '' };

/** Register a redraw callback once the signature font/paths are ready. */
export function setSignatureRedraw(fn) {
  signatureRedraw = fn;
}

function loadSignatureFont() {
  if (!signatureFontPromise) {
    signatureFontPromise = (async () => {
      const mod = await import('https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/+esm');
      const ot = mod.default || mod;
      let lastErr;
      for (const url of SIGNATURE_FONT_URLS) {
        try {
          return await ot.load(url);
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr || new Error('Signature font failed to load');
    })();
  }
  return signatureFontPromise;
}

function cubicLen(x0, y0, x1, y1, x2, y2, x3, y3) {
  let len = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

function quadLen(x0, y0, x1, y1, x2, y2) {
  let len = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * x1 + t * t * x2;
    const y = u * u * y0 + 2 * u * t * y1 + t * t * y2;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

function measureOtPath(path) {
  let len = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const cmd of path.commands) {
    if (cmd.type === 'M') {
      x = cmd.x;
      y = cmd.y;
      startX = x;
      startY = y;
    } else if (cmd.type === 'L') {
      len += Math.hypot(cmd.x - x, cmd.y - y);
      x = cmd.x;
      y = cmd.y;
    } else if (cmd.type === 'C') {
      len += cubicLen(x, y, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
      x = cmd.x;
      y = cmd.y;
    } else if (cmd.type === 'Q') {
      len += quadLen(x, y, cmd.x1, cmd.y1, cmd.x, cmd.y);
      x = cmd.x;
      y = cmd.y;
    } else if (cmd.type === 'Z') {
      len += Math.hypot(startX - x, startY - y);
      x = startX;
      y = startY;
    }
  }
  return Math.max(1, len);
}

function otPathToPath2D(path) {
  const p = new Path2D();
  for (const cmd of path.commands) {
    if (cmd.type === 'M') p.moveTo(cmd.x, cmd.y);
    else if (cmd.type === 'L') p.lineTo(cmd.x, cmd.y);
    else if (cmd.type === 'C') p.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    else if (cmd.type === 'Q') p.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    else if (cmd.type === 'Z') p.closePath();
  }
  return p;
}

function buildSignatureGlyphs(font, text, fontSize) {
  const baseline = fontSize * 1.15;
  const pad = fontSize * 0.1;
  let x = pad;
  const glyphs = [];
  for (const char of text) {
    if (char === '\n') {
      // Signature is single-line for authenticity; treat newline as space advance
      x += fontSize * 0.35;
      continue;
    }
    const glyph = font.charToGlyph(char);
    const path = glyph.getPath(x, baseline, fontSize);
    const advance = (glyph.advanceWidth ?? font.unitsPerEm) * (fontSize / font.unitsPerEm);
    if (char !== ' ' && path.commands.length) {
      glyphs.push({
        path2d: otPathToPath2D(path),
        length: measureOtPath(path),
        space: false,
      });
    }
    x += advance;
  }
  const width = x + pad;
  const height = fontSize * 2.4;
  return { glyphs, width, height, baseline };
}

function getSignatureGlyphs(state) {
  const text = (state.text || 'Signature').replace(/\n+/g, ' ').trim() || 'Signature';
  const size = Math.max(24, state.size);
  const key = `${text}|${size}`;
  if (signatureCache.key === key && signatureCache.glyphs) return signatureCache.glyphs;
  if (signatureCache.failed && signatureCache.key === key) return null;

  loadSignatureFont()
    .then((font) => {
      signatureCache.glyphs = buildSignatureGlyphs(font, text, size);
      signatureCache.key = key;
      signatureCache.failed = false;
      signatureRedraw?.();
    })
    .catch((err) => {
      console.warn('Signature font load failed:', err);
      signatureCache.failed = true;
      signatureCache.key = key;
      signatureRedraw?.();
    });

  return signatureCache.key === key ? signatureCache.glyphs : null;
}

/**
 * Hand-written signature draw-on (Componentry Signature → canvas).
 * Strokes each glyph path with staggered pathLength, then fills.
 */
function drawSignature(ctx, state, time) {
  const data = getSignatureGlyphs(state);
  if (!data || !data.glyphs.length) {
    // Fallback while loading / on failure: soft cursive using Lobster if available
    const prevFont = state.font;
    state.font = 'Lobster';
    withTextOrigin(ctx, state, () => {
      applyFont(ctx, state);
      ctx.globalAlpha = state.opacity * 0.85;
      ctx.fillStyle = state.color;
      const line = (state.text || 'Signature').replace(/\n+/g, ' ');
      ctx.fillText(line, 0, 0);
    });
    state.font = prevFont;
    return;
  }

  const { glyphs, width, height } = data;
  const duration = 1.45; // seconds per glyph stroke
  const stagger = 0.18; // seconds between glyphs
  const hold = 0.9;
  const cycle = (glyphs.length * stagger + duration + hold) * 1000;
  const t = (time % cycle) / 1000;

  ctx.save();
  ctx.translate(state.x * state.w, state.y * state.h);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.translate(-width / 2, -height * 0.55);
  ctx.globalAlpha = state.opacity;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = state.color;
  ctx.fillStyle = state.color;

  glyphs.forEach((g, i) => {
    const start = i * stagger;
    const local = Math.min(1, Math.max(0, (t - start) / duration));
    const drawn = easeOutCubic(local);
    const len = g.length;
    const strokeW = Math.max(1.5, state.size * 0.035);

    // Ink stroke reveal
    ctx.save();
    ctx.lineWidth = strokeW;
    ctx.setLineDash([len * drawn, len + 1]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = state.opacity * (0.35 + 0.65 * Math.min(1, drawn * 1.4));
    ctx.stroke(g.path2d);
    ctx.restore();

    // Fill once mostly drawn
    if (drawn > 0.82) {
      ctx.save();
      ctx.globalAlpha = state.opacity * easeOutCubic((drawn - 0.82) / 0.18);
      ctx.fill(g.path2d);
      ctx.restore();
    }
  });

  ctx.restore();
}

