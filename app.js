// Backtext — put text behind the subject of a photo.
// Pipeline: original image -> text layer -> subject cutout (segmented in-browser).

import {
  LAYOUTS,
  FINISHES,
  BLENDS,
  PATTERNS,
  PAPER_DEFAULTS,
  SUBJECT_EFFECTS,
  SUBJECT_MOTIONS,
  isPaperFinish,
  isSubjectPaperEffect,
  needsAnimation,
  needsSubjectAnimation,
  subjectBounds,
  subjectMotionPose,
  applySubjectMotionTransform,
  buildMaskGrid,
  drawTextEffects,
  drawStickerSubject,
  drawSubjectPaper,
  setSignatureRedraw,
} from './effects.js?v=25';

import {
  EffectStack,
  EFFECT_CATALOG,
  PIPELINE_BLENDS,
  ensureMask,
  paintMaskStroke,
  clearMask,
  exportCubeLUT,
  downloadText,
  makeCanvas,
} from './pipeline.js?v=25';

const MAX_DIM = 1600; // processing cap; keeps segmentation and export snappy
const SEGMENT_TIMEOUT_MS = 90_000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const els = {
  canvas: document.getElementById('canvas'),
  stage: document.getElementById('stage'),
  dropzone: document.getElementById('dropzone'),
  processing: document.getElementById('processing'),
  processingTitle: document.getElementById('processingTitle'),
  processingDetail: document.getElementById('processingDetail'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  fileInput: document.getElementById('fileInput'),
  uploadBtn: document.getElementById('uploadBtn'),
  dropUploadBtn: document.getElementById('dropUploadBtn'),
  sampleBtn: document.getElementById('sampleBtn'),
  dropSampleBtn: document.getElementById('dropSampleBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  downloadVideoBtn: document.getElementById('downloadVideoBtn'),
  downloadBtnDock: document.getElementById('downloadBtnDock'),
  downloadVideoBtnDock: document.getElementById('downloadVideoBtnDock'),
  videoDurationSeg: document.getElementById('videoDurationSeg'),
  videoFormatHint: document.getElementById('videoFormatHint'),
  resetBtn: document.getElementById('resetBtn'),
  panel: document.getElementById('panel'),
  textInput: document.getElementById('textInput'),
  fontSelect: document.getElementById('fontSelect'),
  sizeRange: document.getElementById('sizeRange'),
  sizeValue: document.getElementById('sizeValue'),
  rotationRange: document.getElementById('rotationRange'),
  rotationValue: document.getElementById('rotationValue'),
  posXRange: document.getElementById('posXRange'),
  posXValue: document.getElementById('posXValue'),
  posYRange: document.getElementById('posYRange'),
  posYValue: document.getElementById('posYValue'),
  spacingRange: document.getElementById('spacingRange'),
  spacingValue: document.getElementById('spacingValue'),
  lineHeightRange: document.getElementById('lineHeightRange'),
  lineHeightValue: document.getElementById('lineHeightValue'),
  opacityRange: document.getElementById('opacityRange'),
  opacityValue: document.getElementById('opacityValue'),
  colorInput: document.getElementById('colorInput'),
  swatches: document.getElementById('swatches'),
  behindToggle: document.getElementById('behindToggle'),
  shadowToggle: document.getElementById('shadowToggle'),
  strokeToggle: document.getElementById('strokeToggle'),
  layoutChips: document.getElementById('layoutChips'),
  finishChips: document.getElementById('finishChips'),
  blendSelect: document.getElementById('blendSelect'),
  patternSelect: document.getElementById('patternSelect'),
  color2Input: document.getElementById('color2Input'),
  stickerToggle: document.getElementById('stickerToggle'),
  breakoutToggle: document.getElementById('breakoutToggle'),
  parallaxToggle: document.getElementById('parallaxToggle'),
  effectAddSelect: document.getElementById('effectAddSelect'),
  effectAddBtn: document.getElementById('effectAddBtn'),
  effectStackList: document.getElementById('effectStackList'),
  effectParams: document.getElementById('effectParams'),
  maskTools: document.getElementById('maskTools'),
  maskSize: document.getElementById('maskSize'),
  maskSizeValue: document.getElementById('maskSizeValue'),
  maskHard: document.getElementById('maskHard'),
  maskHardValue: document.getElementById('maskHardValue'),
  maskPaintBtn: document.getElementById('maskPaintBtn'),
  maskEraseBtn: document.getElementById('maskEraseBtn'),
  maskClearBtn: document.getElementById('maskClearBtn'),
  exportLutBtn: document.getElementById('exportLutBtn'),
  clearStackBtn: document.getElementById('clearStackBtn'),
  paperControls: document.getElementById('paperControls'),
  paperThickness: document.getElementById('paperThickness'),
  paperThicknessValue: document.getElementById('paperThicknessValue'),
  paperBevel: document.getElementById('paperBevel'),
  paperBevelValue: document.getElementById('paperBevelValue'),
  paperTexture: document.getElementById('paperTexture'),
  paperTextureValue: document.getElementById('paperTextureValue'),
  paperTorn: document.getElementById('paperTorn'),
  paperTornValue: document.getElementById('paperTornValue'),
  paperCurl: document.getElementById('paperCurl'),
  paperCurlValue: document.getElementById('paperCurlValue'),
  paperShadowSoft: document.getElementById('paperShadowSoft'),
  paperShadowSoftValue: document.getElementById('paperShadowSoftValue'),
  paperTint: document.getElementById('paperTint'),
  subjectEffectChips: document.getElementById('subjectEffectChips'),
  subjectMotionChips: document.getElementById('subjectMotionChips'),
  subjectMotionControls: document.getElementById('subjectMotionControls'),
  subjectMotionAmount: document.getElementById('subjectMotionAmount'),
  subjectMotionAmountValue: document.getElementById('subjectMotionAmountValue'),
};

let forceRecordAnim = false;
let videoSeconds = 3;
let recording = false;

const ctx = els.canvas.getContext('2d');

const DEFAULTS = {
  text: 'BEHIND',
  font: 'Anton',
  color: '#ffffff',
  color2: '#4dd7ff',
  rotation: 0,
  letterSpacing: 2,
  lineHeight: 1.05,
  opacity: 1,
  shadow: false,
  stroke: false,
  layout: 'single',
  finish: 'none',
  blend: 'source-over',
  pattern: 'stripes',
  sticker: false,
  breakout: false,
  parallax: false,
  lightX: 0.3,
  lightY: 0.2,
  paper: { ...PAPER_DEFAULTS },
  subjectEffect: 'none',
  subjectPaper: { ...PAPER_DEFAULTS },
  subjectMotion: 'none',
  subjectMotionAmount: 0.55,
};

const state = {
  srcCanvas: null,
  w: 0,
  h: 0,
  fg: null,
  mask: null,
  sourceBlob: null,
  size: 120,
  x: 0.5,
  y: 0.5,
  animId: 0,
  pointerX: 0.5,
  pointerY: 0.5,
  stack: new EffectStack(),
  selectedEffectId: null,
  maskMode: null, // 'paint' | 'erase' | null
  maskBrush: { size: 40, hardness: 0.6 },
  lastMaskPt: null,
  ...DEFAULTS,
  paper: { ...PAPER_DEFAULTS },
  subjectPaper: { ...PAPER_DEFAULTS },
};

/* ---------------- status ---------------- */

function setStatus(mode, text) {
  els.status.dataset.state = mode;
  els.statusText.textContent = text;
}

/* ---------------- rendering ---------------- */

function applyFont(c) {
  c.font = `${state.size}px "${state.font}"`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  try { c.letterSpacing = `${state.letterSpacing}px`; } catch (_) { /* older engines */ }
}

/** Cache static subject bitmap so motion anim doesn't rebuild paper each frame. */
let subjectBitmapCache = { key: '', canvas: null, bounds: null, fg: null };

function invalidateSubjectBitmap() {
  subjectBitmapCache = { key: '', canvas: null, bounds: null, fg: null };
}

function subjectBitmapKey() {
  const p = state.subjectPaper || {};
  return [
    state.subjectEffect,
    state.sticker ? 1 : 0,
    p.thickness, p.bevel, p.texture, p.torn, p.curl, p.shadowSoft, p.tint,
    state.w, state.h,
  ].join('|');
}

function getSubjectBitmap(w, h) {
  const key = subjectBitmapKey();
  if (
    subjectBitmapCache.key === key
    && subjectBitmapCache.canvas
    && subjectBitmapCache.fg === state.fg
  ) {
    return subjectBitmapCache;
  }
  const canvas = makeCanvas(w, h);
  const x = canvas.getContext('2d');
  if (isSubjectPaperEffect(state.subjectEffect)) {
    drawSubjectPaper(x, state.fg, w, h, state);
  } else if (state.sticker) {
    drawStickerSubject(x, state.fg, w, h);
  } else {
    x.drawImage(state.fg, 0, 0, w, h);
  }
  const bounds = subjectBounds(state.fg, w, h);
  subjectBitmapCache = { key, canvas, bounds, fg: state.fg };
  return subjectBitmapCache;
}

function drawSubjectLayer(cctx, w, h, time = 0) {
  if (!state.fg) return;
  const { canvas, bounds } = getSubjectBitmap(w, h);
  const motion = state.subjectMotion || 'none';
  cctx.save();
  if (needsSubjectAnimation(motion)) {
    const pose = subjectMotionPose(motion, time, state.subjectMotionAmount, bounds);
    applySubjectMotionTransform(cctx, pose);
  }
  cctx.drawImage(canvas, 0, 0);
  cctx.restore();
}

function render(time = performance.now()) {
  if (!state.srcCanvas) return;
  const { w, h } = state;

  // Compose onto an offscreen buffer, then run the effect stack.
  const comp = makeCanvas(w, h);
  const cctx = comp.getContext('2d');

  const parallax = state.parallax ? 1 : 0;
  const mx = (state.pointerX - 0.5) * parallax;
  const my = (state.pointerY - 0.5) * parallax;
  const bgOff = { x: mx * -12, y: my * -8 };
  const textOff = { x: mx * 6, y: my * 4 };
  const subOff = { x: mx * 18, y: my * 14 };

  if (state.breakout) {
    const inset = Math.round(Math.min(w, h) * 0.06);
    cctx.fillStyle = '#0a0a0c';
    cctx.fillRect(0, 0, w, h);
    cctx.save();
    cctx.beginPath();
    cctx.rect(inset, inset, w - inset * 2, h - inset * 2);
    cctx.clip();
    cctx.drawImage(state.srcCanvas, bgOff.x, bgOff.y, w, h);
    cctx.save();
    cctx.translate(textOff.x, textOff.y);
    const result = drawTextEffects(cctx, state, {
      fg: state.fg,
      mask: state.mask,
      behind: els.behindToggle.checked && state.fg,
      time,
    });
    cctx.restore();
    cctx.restore();
    if (state.fg) {
      cctx.save();
      cctx.translate(subOff.x, subOff.y);
      drawSubjectLayer(cctx, w, h, time);
      if (result.splitFront) cctx.drawImage(result.splitFront, 0, 0);
      cctx.restore();
    }
    cctx.strokeStyle = 'rgba(255,255,255,0.35)';
    cctx.lineWidth = 2;
    cctx.strokeRect(inset + 0.5, inset + 0.5, w - inset * 2 - 1, h - inset * 2 - 1);
  } else {
    cctx.save();
    cctx.translate(bgOff.x, bgOff.y);
    cctx.drawImage(state.srcCanvas, 0, 0, w, h);
    cctx.restore();

    cctx.save();
    cctx.translate(textOff.x, textOff.y);
    const behind = els.behindToggle.checked && state.fg;
    const result = drawTextEffects(cctx, state, {
      fg: state.fg,
      mask: state.mask,
      behind,
      time,
    });
    cctx.restore();

    if (result.drawCutout && state.fg) {
      cctx.save();
      cctx.translate(subOff.x, subOff.y);
      drawSubjectLayer(cctx, w, h, time);
      if (result.splitFront) cctx.drawImage(result.splitFront, 0, 0);
      cctx.restore();
    }
  }

  const hasFx = state.stack.effects.some((e) => e.enabled);
  let finalCanvas = comp;
  if (hasFx) {
    try {
      finalCanvas = state.stack.apply(comp);
    } catch (err) {
      console.error('Effect stack failed:', err);
      finalCanvas = comp;
    }
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(finalCanvas, 0, 0);

  // Mask overlay while painting
  if (state.maskMode && state.selectedEffectId) {
    const fx = state.stack.get(state.selectedEffectId);
    if (fx?.mask) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(fx.mask, 0, 0);
      ctx.restore();
    }
  }

  // Keep display size in sync — toggles/effects re-render often and must not
  // fall back to intrinsic bitmap size (that crops tall photos in the stage).
  fitCanvasToStage();
}

function ensureAnimLoop() {
  const want =
    needsAnimation(state.finish)
    || needsSubjectAnimation(state.subjectMotion)
    || state.parallax
    || forceRecordAnim;
  if (want && !state.animId) {
    const tick = (t) => {
      state.animId = requestAnimationFrame(tick);
      render(t);
    };
    state.animId = requestAnimationFrame(tick);
  } else if (!want && state.animId) {
    cancelAnimationFrame(state.animId);
    state.animId = 0;
  }
}

function setExportEnabled(on) {
  for (const el of [
    els.downloadBtn,
    els.downloadVideoBtn,
    els.downloadBtnDock,
    els.downloadVideoBtnDock,
  ]) {
    if (el) el.disabled = !on || recording;
  }
}

function pickRecorderMime() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

function syncVideoFormatHint() {
  if (!els.videoFormatHint) return;
  const mime = pickRecorderMime();
  if (!mime) {
    els.videoFormatHint.textContent = 'Video export is not supported in this browser.';
  } else if (mime.includes('mp4')) {
    els.videoFormatHint.textContent = 'Records a short MP4 of the live preview (motion + animated finishes).';
  } else {
    els.videoFormatHint.textContent = 'This browser records WebM (same clip — open in Chrome or convert to MP4).';
  }
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function downloadPng() {
  if (!state.srcCanvas || recording) return;
  render();
  els.canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, 'backtext.png');
    setStatus('ready', 'Saved backtext.png');
  }, 'image/png');
}

async function downloadVideo() {
  if (!state.srcCanvas || recording) return;
  if (typeof MediaRecorder === 'undefined' || !els.canvas.captureStream) {
    setStatus('error', 'Video export needs a newer browser.');
    return;
  }
  const mime = pickRecorderMime();
  if (!mime) {
    setStatus('error', 'No video codec available here.');
    return;
  }

  recording = true;
  setExportEnabled(false);
  const labelBtns = [els.downloadVideoBtn, els.downloadVideoBtnDock].filter(Boolean);
  for (const btn of labelBtns) {
    const span = btn.querySelector('span');
    if (span) span.textContent = 'Recording…';
  }
  setStatus('busy', `Recording ${videoSeconds}s…`);

  forceRecordAnim = true;
  ensureAnimLoop();
  render(performance.now());

  const fps = 30;
  const stream = els.canvas.captureStream(fps);
  let recorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 8_000_000,
    });
  } catch (err) {
    console.error(err);
    stream.getTracks().forEach((t) => t.stop());
    forceRecordAnim = false;
    ensureAnimLoop();
    recording = false;
    setExportEnabled(true);
    for (const btn of labelBtns) {
      const span = btn.querySelector('span');
      if (span) span.textContent = 'MP4';
    }
    setStatus('error', 'Could not start the video recorder.');
    return;
  }

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };

  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = () => reject(recorder.error || new Error('Recorder failed'));
  });

  try {
    recorder.start(100);
    await new Promise((r) => setTimeout(r, videoSeconds * 1000 + 80));
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: mime.split(';')[0] });
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    downloadBlob(blob, `backtext.${ext}`);
    setStatus('ready', `Saved backtext.${ext}`);
  } catch (err) {
    console.error(err);
    setStatus('error', 'Video export failed.');
  } finally {
    stream.getTracks().forEach((t) => t.stop());
    forceRecordAnim = false;
    ensureAnimLoop();
    recording = false;
    setExportEnabled(!!state.srcCanvas);
    for (const btn of labelBtns) {
      const span = btn.querySelector('span');
      if (span) span.textContent = 'MP4';
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

function bindPanelAccordion() {
  if (!els.panel) return;
  els.panel.querySelectorAll('.panel-block__head').forEach((btn) => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.panel-block');
      if (!block) return;
      const open = block.dataset.open === 'true';
      block.dataset.open = open ? 'false' : 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
}

function bindVideoDuration() {
  if (!els.videoDurationSeg) return;
  els.videoDurationSeg.querySelectorAll('.seg__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      videoSeconds = Number(btn.dataset.seconds) || 3;
      els.videoDurationSeg.querySelectorAll('.seg__btn').forEach((b) => {
        b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
      });
    });
  });
}

/** Scale the canvas display to fit the stage without cropping. */
function fitCanvasToStage() {
  if (!state.w || !state.h) return;
  const pad = 48;
  const availW = Math.max(120, els.stage.clientWidth - pad);
  const availH = Math.max(120, els.stage.clientHeight - pad);
  const scale = Math.min(1, availW / state.w, availH / state.h);
  els.canvas.style.width = `${Math.round(state.w * scale)}px`;
  els.canvas.style.height = `${Math.round(state.h * scale)}px`;
}

/* ---------------- segmentation engines ---------------- */

async function segmentWithImgly(blob, onProgress) {
  const mod = await withTimeout(
    import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm'),
    SEGMENT_TIMEOUT_MS,
    'imgly import'
  );
  const out = await withTimeout(
    mod.removeBackground(blob, {
      model: 'isnet_quint8',
      progress: (key, current, total) => {
        const phase = key && key.startsWith('fetch') ? 'fetch' : 'run';
        const pct = total > 0 ? Math.round((current / total) * 100) : null;
        onProgress(phase, pct);
      },
    }),
    SEGMENT_TIMEOUT_MS,
    'imgly removeBackground'
  );
  return out;
}

async function segmentWithRmbg(imageBitmap, onProgress) {
  const mod = await withTimeout(
    import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6'),
    SEGMENT_TIMEOUT_MS,
    'transformers import'
  );
  mod.env.allowLocalModels = false;

  const progress = (p) => {
    if (p && p.status === 'progress' && p.total) {
      onProgress('fetch', Math.round((p.loaded / p.total) * 100));
    } else if (p && p.status === 'ready') {
      onProgress('run', null);
    }
  };

  // Convert the image to a URL the pipeline can read.
  const tmp = document.createElement('canvas');
  tmp.width = imageBitmap.width;
  tmp.height = imageBitmap.height;
  tmp.getContext('2d').drawImage(imageBitmap, 0, 0);
  const url = tmp.toDataURL('image/png');

  let maskRaw = null;
  try {
    const segmenter = await withTimeout(
      mod.pipeline('background-removal', 'briaai/RMBG-1.4', {
        dtype: 'q8',
        progress_callback: progress,
      }),
      SEGMENT_TIMEOUT_MS,
      'RMBG pipeline'
    );
    const output = await withTimeout(segmenter(url), SEGMENT_TIMEOUT_MS, 'RMBG run');
    const first = Array.isArray(output) ? output[0] : output;
    maskRaw = first && first.mask;
  } catch (err) {
    // Fallback to the manual model path used by the official demo.
    const model = await withTimeout(
      mod.AutoModel.from_pretrained('briaai/RMBG-1.4', {
        dtype: 'q8',
        progress_callback: progress,
      }),
      SEGMENT_TIMEOUT_MS,
      'RMBG model'
    );
    const processor = await withTimeout(
      mod.AutoProcessor.from_pretrained('briaai/RMBG-1.4'),
      SEGMENT_TIMEOUT_MS,
      'RMBG processor'
    );
    const img = await mod.RawImage.fromURL(url);
    const { pixel_values } = await processor(img);
    const { output } = await withTimeout(model({ input: pixel_values }), SEGMENT_TIMEOUT_MS, 'RMBG infer');
    maskRaw = await mod.RawImage.fromTensor(output[0][0].mul(255).to('uint8'));
  }
  if (!maskRaw) throw new Error('No mask produced');

  // Subject cutout = original pixels + mask as alpha.
  const maskCanvas = rawImageToCanvas(maskRaw);
  const cut = document.createElement('canvas');
  cut.width = imageBitmap.width;
  cut.height = imageBitmap.height;
  const cctx = cut.getContext('2d');
  cctx.drawImage(imageBitmap, 0, 0);
  cctx.globalCompositeOperation = 'destination-in';
  cctx.drawImage(maskCanvas, 0, 0, cut.width, cut.height);
  return createImageBitmap(cut);
}

function rawImageToCanvas(raw) {
  const { width, height, channels, data } = raw;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext('2d');
  const img = c.createImageData(width, height);
  const px = img.data;
  for (let i = 0; i < width * height; i++) {
    if (channels === 1) {
      const v = data[i];
      px[i * 4] = 255; px[i * 4 + 1] = 255; px[i * 4 + 2] = 255; px[i * 4 + 3] = v;
    } else if (channels === 3) {
      px[i * 4] = data[i * 3]; px[i * 4 + 1] = data[i * 3 + 1];
      px[i * 4 + 2] = data[i * 3 + 2]; px[i * 4 + 3] = 255;
    } else {
      px[i * 4] = data[i * 4]; px[i * 4 + 1] = data[i * 4 + 1];
      px[i * 4 + 2] = data[i * 4 + 2]; px[i * 4 + 3] = data[i * 4 + 3];
    }
  }
  c.putImageData(img, 0, 0);
  return canvas;
}

async function runSegmentation() {
  showProcessing(true);
  els.behindToggle.disabled = true;
  setStatus('busy', 'Cutting out the subject…');

  const onProgress = (phase, pct) => {
    if (phase === 'fetch') {
      els.processingTitle.textContent = 'Downloading the cutout model…';
      els.processingDetail.textContent = pct != null
        ? `${pct}% — cached after the first run.`
        : 'Fetching model weights…';
    } else {
      els.processingTitle.textContent = 'Cutting out the subject…';
      els.processingDetail.textContent = 'Running the model on your photo.';
    }
  };

  try {
    let fgBlob;
    try {
      fgBlob = await segmentWithImgly(state.sourceBlob, onProgress);
      state.fg = await createImageBitmap(fgBlob);
    } catch (imglyErr) {
      console.warn('imgly engine failed, falling back to RMBG:', imglyErr);
      onProgress('fetch', null);
      const bmp = await createImageBitmap(state.sourceBlob);
      state.fg = await segmentWithRmbg(bmp, onProgress);
    }
    invalidateSubjectBitmap();
    els.behindToggle.disabled = false;
    state.mask = buildMaskGrid(state.fg, state.w, state.h, 8);
    setStatus('ready', 'Subject isolated — text sits behind it.');
  } catch (err) {
    console.error('Segmentation failed:', err);
    state.fg = null;
    state.mask = null;
    invalidateSubjectBitmap();
    setStatus('error', 'Cutout failed — text will sit on top. Check your connection.');
  } finally {
    showProcessing(false);
    fitCanvasToStage();
    ensureAnimLoop();
    render();
  }
}

function showProcessing(on) {
  els.processing.hidden = !on;
  els.processing.classList.toggle('is-active', on);
}

/* ---------------- image loading ---------------- */

async function setSourceBlob(blob) {
  let bmp;
  try {
    bmp = await createImageBitmap(blob);
  } catch (_) {
    setStatus('error', 'That file does not look like an image.');
    return;
  }

  const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);

  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  src.getContext('2d').drawImage(bmp, 0, 0, w, h);

  state.srcCanvas = src;
  state.w = w;
  state.h = h;
  state.fg = null;
  state.mask = null;
  state.sourceBlob = blob;

  els.canvas.width = w;
  els.canvas.height = h;
  els.canvas.hidden = false;
  els.canvas.style.cursor = 'grab';
  els.dropzone.style.display = 'none';
  setExportEnabled(true);
  els.behindToggle.disabled = true;
  els.behindToggle.checked = true;

  // Sensible defaults scaled to this image — large enough to peek around the subject.
  state.size = Math.round(w * 0.22);
  els.sizeRange.max = String(Math.round(w * 0.7));
  els.sizeRange.value = String(state.size);
  state.letterSpacing = Math.round(w * 0.012);
  els.spacingRange.value = String(state.letterSpacing);
  state.x = 0.5;
  state.y = 0.42;

  syncLabels();
  syncPositionSliders();
  setStatus('busy', 'Photo loaded.');
  fitCanvasToStage();
  render();
  runSegmentation();
}

function handleFiles(files) {
  const file = files && files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    setStatus('error', 'Please pick an image file.');
    return;
  }
  setSourceBlob(file);
}

async function loadSample() {
  setStatus('busy', 'Loading sample photo…');
  try {
    const res = await fetch('sample.jpg');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    await setSourceBlob(blob);
  } catch (err) {
    console.warn('Sample load failed:', err);
    setStatus('error', 'Sample photo missing — upload one of yours.');
  }
}

/* ---------------- controls ---------------- */

function syncLabels() {
  els.sizeValue.textContent = `${state.size}px`;
  els.rotationValue.textContent = `${state.rotation}°`;
  els.posXValue.textContent = `${Math.round(state.x * 100)}%`;
  els.posYValue.textContent = `${Math.round(state.y * 100)}%`;
  els.spacingValue.textContent = `${state.letterSpacing}px`;
  els.lineHeightValue.textContent = `${Math.round(state.lineHeight * 100)}%`;
  els.opacityValue.textContent = `${Math.round(state.opacity * 100)}%`;
}

function syncPositionSliders() {
  els.posXRange.value = String(Math.round(Math.min(100, Math.max(0, state.x * 100))));
  els.posYRange.value = String(Math.round(Math.min(100, Math.max(0, state.y * 100))));
}

function bindEffectChips() {
  const chipDefaults = {
    layout: 'single',
    finish: 'none',
    subjectEffect: 'none',
    subjectMotion: 'none',
  };
  const mount = (el, items, key) => {
    el.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = item.label;
      btn.dataset.id = item.id;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state[key] === item.id ? 'true' : 'false');
      btn.addEventListener('click', () => {
        // Re-clicking the active option clears back to the section default.
        const fallback = chipDefaults[key];
        if (state[key] === item.id && fallback != null && item.id !== fallback) {
          state[key] = fallback;
        } else {
          state[key] = item.id;
        }
        for (const child of el.children) {
          child.setAttribute('aria-checked', child.dataset.id === state[key] ? 'true' : 'false');
        }
        if (key === 'finish' || key === 'subjectEffect') syncPaperControls();
        if (key === 'subjectEffect') invalidateSubjectBitmap();
        if (key === 'subjectMotion') syncSubjectMotionControls();
        ensureAnimLoop();
        render();
      });
      el.appendChild(btn);
    }
  };
  mount(els.layoutChips, LAYOUTS, 'layout');
  mount(els.finishChips, FINISHES, 'finish');
  if (els.subjectEffectChips) {
    mount(els.subjectEffectChips, SUBJECT_EFFECTS, 'subjectEffect');
  }
  if (els.subjectMotionChips) {
    mount(els.subjectMotionChips, SUBJECT_MOTIONS, 'subjectMotion');
  }

  els.blendSelect.innerHTML = '';
  for (const b of BLENDS) {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.label;
    if (b.id === state.blend) opt.selected = true;
    els.blendSelect.appendChild(opt);
  }
  els.patternSelect.innerHTML = '';
  for (const p of PATTERNS) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    if (p.id === state.pattern) opt.selected = true;
    els.patternSelect.appendChild(opt);
  }
}

function syncEffectChips() {
  for (const [el, key] of [
    [els.layoutChips, 'layout'],
    [els.finishChips, 'finish'],
    [els.subjectEffectChips, 'subjectEffect'],
    [els.subjectMotionChips, 'subjectMotion'],
  ]) {
    if (!el) continue;
    for (const child of el.children) {
      child.setAttribute('aria-checked', child.dataset.id === state[key] ? 'true' : 'false');
    }
  }
  syncPaperControls();
  syncSubjectMotionControls();
}

function syncSubjectMotionControls() {
  if (!els.subjectMotionControls) return;
  const on = needsSubjectAnimation(state.subjectMotion);
  els.subjectMotionControls.hidden = !on;
  if (!on || !els.subjectMotionAmount) return;
  const pct = Math.round((state.subjectMotionAmount ?? 0.55) * 100);
  els.subjectMotionAmount.value = String(pct);
  if (els.subjectMotionAmountValue) els.subjectMotionAmountValue.textContent = `${pct}%`;
}

function bindSubjectMotionControls() {
  if (!els.subjectMotionAmount) return;
  els.subjectMotionAmount.addEventListener('input', () => {
    state.subjectMotionAmount = Number(els.subjectMotionAmount.value) / 100;
    if (els.subjectMotionAmountValue) {
      els.subjectMotionAmountValue.textContent = `${els.subjectMotionAmount.value}%`;
    }
    ensureAnimLoop();
    render();
  });
}

function syncPaperControls() {
  if (!els.paperControls) return;
  // Params drive the subject paper effect (and still work for text paper finishes).
  const subOn = isSubjectPaperEffect(state.subjectEffect);
  const textOn = isPaperFinish(state.finish);
  const on = subOn || textOn;
  els.paperControls.hidden = !on;
  if (!on) return;
  const title = els.paperControls.querySelector('.field-label');
  const hint = els.paperControls.querySelector('.hint');
  if (title) {
    title.textContent = subOn && textOn
      ? 'Paper params'
      : subOn
        ? 'Subject paper'
        : 'Text paper';
  }
  if (hint) {
    hint.textContent = subOn
      ? 'Applies paper cut depth, torn rim, folds, and shadows to the cut-out person — not the text.'
      : 'Tunes the paper slab behind the text. Pick a Subject effect to paper-cut the person.';
  }
  const p = state.subjectPaper || (state.subjectPaper = { ...PAPER_DEFAULTS });
  // Keep text paper params in sync so text paper finishes still respond.
  state.paper = p;
  const setPct = (input, label, key) => {
    if (!input) return;
    input.value = String(Math.round((p[key] ?? 0) * 100));
    if (label) label.textContent = `${Math.round((p[key] ?? 0) * 100)}%`;
  };
  setPct(els.paperThickness, els.paperThicknessValue, 'thickness');
  setPct(els.paperBevel, els.paperBevelValue, 'bevel');
  setPct(els.paperTexture, els.paperTextureValue, 'texture');
  setPct(els.paperTorn, els.paperTornValue, 'torn');
  setPct(els.paperCurl, els.paperCurlValue, 'curl');
  setPct(els.paperShadowSoft, els.paperShadowSoftValue, 'shadowSoft');
  if (els.paperTint) els.paperTint.value = p.tint || PAPER_DEFAULTS.tint;
}

function bindPaperControls() {
  if (!els.paperControls) return;
  const bindPct = (input, label, key) => {
    if (!input) return;
    input.addEventListener('input', () => {
      if (!state.subjectPaper) state.subjectPaper = { ...PAPER_DEFAULTS };
      state.subjectPaper[key] = Number(input.value) / 100;
      state.paper = state.subjectPaper;
      if (label) label.textContent = `${input.value}%`;
      invalidateSubjectBitmap();
      render();
    });
  };
  bindPct(els.paperThickness, els.paperThicknessValue, 'thickness');
  bindPct(els.paperBevel, els.paperBevelValue, 'bevel');
  bindPct(els.paperTexture, els.paperTextureValue, 'texture');
  bindPct(els.paperTorn, els.paperTornValue, 'torn');
  bindPct(els.paperCurl, els.paperCurlValue, 'curl');
  bindPct(els.paperShadowSoft, els.paperShadowSoftValue, 'shadowSoft');
  els.paperTint?.addEventListener('input', () => {
    if (!state.subjectPaper) state.subjectPaper = { ...PAPER_DEFAULTS };
    state.subjectPaper.tint = els.paperTint.value;
    state.paper = state.subjectPaper;
    invalidateSubjectBitmap();
    render();
  });
}

/* ---------------- effect stack UI ---------------- */

let renderTimer = 0;
/** Debounce heavy stack re-renders while dragging sliders. */
function scheduleRender() {
  if (renderTimer) cancelAnimationFrame(renderTimer);
  renderTimer = requestAnimationFrame(() => {
    renderTimer = 0;
    render();
  });
}

function refreshEffectAddSelect() {
  els.effectAddSelect.innerHTML = '';
  for (const item of EFFECT_CATALOG) {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.label;
    els.effectAddSelect.appendChild(opt);
  }
}

function refreshStackList() {
  els.effectStackList.innerHTML = '';
  if (!state.stack.effects.length) {
    const empty = document.createElement('li');
    empty.className = 'stack-empty';
    empty.textContent = 'No effects yet — pick one above and click Add.';
    els.effectStackList.appendChild(empty);
    if (els.clearStackBtn) els.clearStackBtn.hidden = true;
    return;
  }
  if (els.clearStackBtn) els.clearStackBtn.hidden = false;
  state.stack.effects.forEach((fx, index) => {
    const li = document.createElement('li');
    const active = fx.id === state.selectedEffectId;
    li.className = 'stack-item' + (active ? ' is-active' : '') + (fx.enabled ? '' : ' is-off');
    li.innerHTML = `
      <div class="stack-item-row">
        <label class="stack-enable" title="Toggle effect on or off">
          <input type="checkbox" ${fx.enabled ? 'checked' : ''} />
          <span>${fx.enabled ? 'On' : 'Off'}</span>
        </label>
        <span class="stack-item-name">${index + 1}. ${fx.constructor.label}</span>
        <span class="stack-item-actions">
          <button type="button" class="btn ghost stack-act" data-act="up" title="Move up">↑</button>
          <button type="button" class="btn ghost stack-act" data-act="down" title="Move down">↓</button>
          <button type="button" class="btn ghost stack-act stack-act--danger" data-act="del" title="Remove effect">Remove</button>
        </span>
      </div>
    `;
    const check = li.querySelector('input');
    const enableLabel = li.querySelector('.stack-enable span');
    check.addEventListener('click', (e) => e.stopPropagation());
    check.addEventListener('change', () => {
      fx.enabled = check.checked;
      if (enableLabel) enableLabel.textContent = fx.enabled ? 'On' : 'Off';
      li.classList.toggle('is-off', !fx.enabled);
      scheduleRender();
    });
    li.addEventListener('click', () => {
      state.selectedEffectId = fx.id;
      refreshStackList();
      renderEffectParams();
    });
    li.querySelector('[data-act="up"]').addEventListener('click', (e) => {
      e.stopPropagation();
      state.stack.move(fx.id, -1);
      refreshStackList();
      renderEffectParams();
      scheduleRender();
    });
    li.querySelector('[data-act="down"]').addEventListener('click', (e) => {
      e.stopPropagation();
      state.stack.move(fx.id, 1);
      refreshStackList();
      renderEffectParams();
      scheduleRender();
    });
    li.querySelector('[data-act="del"]').addEventListener('click', (e) => {
      e.stopPropagation();
      state.stack.remove(fx.id);
      if (state.selectedEffectId === fx.id) {
        state.selectedEffectId = state.stack.effects[0]?.id || null;
        state.maskMode = null;
      }
      refreshStackList();
      renderEffectParams();
      scheduleRender();
      setStatus('ready', `Removed ${fx.constructor.label}.`);
    });

    // Mount live controls under the selected effect so options are obvious.
    if (active) {
      const host = document.createElement('div');
      host.className = 'stack-item-params';
      host.addEventListener('click', (e) => e.stopPropagation());
      li.appendChild(host);
      host.dataset.paramsHost = '1';
    }

    els.effectStackList.appendChild(li);
  });
}

function clearEffectStack() {
  state.stack.effects = [];
  state.selectedEffectId = null;
  state.maskMode = null;
  els.canvas.classList.remove('masking');
  refreshStackList();
  renderEffectParams();
  scheduleRender();
  setStatus('ready', 'Cleared all grade effects.');
}

function openPanelBlock(name) {
  const block = els.panel?.querySelector(`.panel-block[data-block="${name}"]`);
  if (!block) return;
  block.dataset.open = 'true';
  const head = block.querySelector('.panel-block__head');
  if (head) head.setAttribute('aria-expanded', 'true');
}

function paramControl(fx, key, meta) {
  const wrap = document.createElement('div');
  const label = document.createElement('label');
  label.className = 'field-label';
  const valueEl = document.createElement('span');
  valueEl.className = 'field-value';
  label.append(meta.label || key, ' ', valueEl);

  let input;
  if (meta.type === 'color') {
    input = document.createElement('input');
    input.type = 'color';
    input.value = fx.params[key] || '#000000';
    valueEl.textContent = fx.params[key];
    input.addEventListener('input', () => {
      fx.params[key] = input.value;
      valueEl.textContent = input.value;
      scheduleRender();
    });
  } else if (meta.type === 'select') {
    input = document.createElement('select');
    for (const opt of meta.options) {
      const o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.label;
      if (opt.id === fx.params[key]) o.selected = true;
      input.appendChild(o);
    }
    valueEl.textContent = '';
    input.addEventListener('change', () => {
      fx.params[key] = input.value;
      scheduleRender();
    });
  } else if (meta.type === 'curves') {
    input = document.createElement('canvas');
    input.className = 'curves-editor';
    input.width = 260;
    input.height = 140;
    valueEl.textContent = '';
    bindCurvesEditor(input, fx);
  } else {
    input = document.createElement('input');
    input.type = 'range';
    input.min = String(meta.min ?? 0);
    input.max = String(meta.max ?? 1);
    input.step = String(meta.step ?? 0.01);
    const cur = fx.params[key];
    input.value = String(cur != null ? cur : meta.min ?? 0);
    const fmt = meta.format || ((v) => Number(v).toFixed(2));
    valueEl.textContent = fmt(Number(input.value));
    input.addEventListener('input', () => {
      const v = Number(input.value);
      fx.params[key] = v;
      valueEl.textContent = fmt(v);
      scheduleRender();
    });
  }

  wrap.append(label, input);
  return wrap;
}

function paramSchema(fx) {
  switch (fx.type) {
    case 'gradientMap':
      return {
        shadows: { type: 'color', label: 'Shadows' },
        midtones: { type: 'color', label: 'Midtones' },
        highlights: { type: 'color', label: 'Highlights' },
      };
    case 'bloom':
      return {
        threshold: { label: 'Threshold', min: 0, max: 1, step: 0.01 },
        radius: { label: 'Radius', min: 1, max: 40, step: 1, format: (v) => `${Math.round(v)}px` },
        intensity: { label: 'Intensity', min: 0, max: 2, step: 0.01 },
      };
    case 'grain':
      return {
        stock: {
          type: 'select',
          label: 'Stock',
          options: [
            { id: '35mm', label: '35mm' },
            { id: 'kodak', label: 'Kodak' },
            { id: 'fuji', label: 'Fuji' },
            { id: 'ilford', label: 'Ilford' },
            { id: 'cinema', label: 'Cinema' },
          ],
        },
        amount: { label: 'Amount', min: 0, max: 1, step: 0.01 },
        size: { label: 'Grain size', min: 0.4, max: 3, step: 0.05 },
      };
    case 'vignette':
      return {
        amount: { label: 'Amount', min: 0, max: 1, step: 0.01 },
        softness: { label: 'Softness', min: 0.05, max: 1, step: 0.01 },
        roundness: { label: 'Roundness', min: 0.5, max: 1.5, step: 0.01 },
      };
    case 'glass':
      return {
        amount: { label: 'Amount', min: 0, max: 16, step: 0.5 },
        frequency: { label: 'Frequency', min: 0.01, max: 0.12, step: 0.005 },
      };
    case 'shadow':
      return {
        lift: { label: 'Lift', min: 0, max: 0.4, step: 0.01 },
        shadow: { label: 'Shadows', min: 0, max: 0.6, step: 0.01 },
      };
    case 'brightnessContrast':
      return {
        brightness: { label: 'Brightness', min: -0.5, max: 0.5, step: 0.01 },
        contrast: { label: 'Contrast', min: -0.5, max: 0.5, step: 0.01 },
      };
    case 'hueSaturation':
      return {
        hue: { label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${Math.round(v)}°` },
        saturation: { label: 'Saturation', min: -1, max: 1, step: 0.01 },
        lightness: { label: 'Lightness', min: -0.5, max: 0.5, step: 0.01 },
      };
    case 'levels':
      return {
        inBlack: { label: 'In black', min: 0, max: 254, step: 1, format: (v) => Math.round(v) },
        inWhite: { label: 'In white', min: 1, max: 255, step: 1, format: (v) => Math.round(v) },
        gamma: { label: 'Gamma', min: 0.2, max: 3, step: 0.01 },
        outBlack: { label: 'Out black', min: 0, max: 254, step: 1, format: (v) => Math.round(v) },
        outWhite: { label: 'Out white', min: 1, max: 255, step: 1, format: (v) => Math.round(v) },
      };
    case 'curves':
      return { points: { type: 'curves', label: 'RGB curve' } };
    case 'halation':
      return {
        threshold: { label: 'Threshold', min: 0, max: 1, step: 0.01 },
        radius: { label: 'Radius', min: 2, max: 40, step: 1, format: (v) => `${Math.round(v)}px` },
        intensity: { label: 'Intensity', min: 0, max: 2, step: 0.01 },
        tint: { type: 'color', label: 'Tint' },
      };
    default:
      return {};
  }
}

function bindCurvesEditor(canvas, fx) {
  const c = canvas.getContext('2d');
  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#0c0c10';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#2a2a33';
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo((w * i) / 4, 0);
      c.lineTo((w * i) / 4, h);
      c.moveTo(0, (h * i) / 4);
      c.lineTo(w, (h * i) / 4);
      c.stroke();
    }
    const pts = fx.params.points;
    c.strokeStyle = '#ffd02f';
    c.lineWidth = 2;
    c.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * w;
      const y = (1 - p.y) * h;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    });
    c.stroke();
    c.fillStyle = '#fff';
    pts.forEach((p) => {
      c.beginPath();
      c.arc(p.x * w, (1 - p.y) * h, 4, 0, Math.PI * 2);
      c.fill();
    });
  };
  draw();

  let drag = -1;
  const hit = (x, y) => {
    const w = canvas.width;
    const h = canvas.height;
    return fx.params.points.findIndex((p) => {
      const dx = p.x * w - x;
      const dy = (1 - p.y) * h - y;
      return dx * dx + dy * dy < 64;
    });
  };
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    drag = hit(p.x, p.y);
    if (drag < 0 && fx.params.points.length < 8) {
      fx.params.points.push({
        x: Math.min(1, Math.max(0, p.x / canvas.width)),
        y: Math.min(1, Math.max(0, 1 - p.y / canvas.height)),
      });
      fx.params.points.sort((a, b) => a.x - b.x);
      drag = hit(p.x, p.y);
    }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag < 0) return;
    const p = pos(e);
    const pt = fx.params.points[drag];
    if (drag !== 0 && drag !== fx.params.points.length - 1) {
      pt.x = Math.min(0.98, Math.max(0.02, p.x / canvas.width));
    }
    pt.y = Math.min(1, Math.max(0, 1 - p.y / canvas.height));
    fx.params.points.sort((a, b) => a.x - b.x);
    drag = fx.params.points.indexOf(pt);
    draw();
    scheduleRender();
  });
  canvas.addEventListener('pointerup', () => { drag = -1; });
}

function renderEffectParams() {
  const fx = state.selectedEffectId ? state.stack.get(state.selectedEffectId) : null;
  // Prefer the inline host under the selected stack item; fall back to the panel slot.
  const inlineHost = els.effectStackList.querySelector('[data-params-host]');
  const mount = inlineHost || els.effectParams;
  els.effectParams.innerHTML = '';
  if (inlineHost) inlineHost.innerHTML = '';

  if (!fx) {
    els.effectParams.hidden = true;
    els.maskTools.hidden = true;
    els.canvas.classList.remove('masking');
    return;
  }

  // Keep the legacy slot hidden when we render inline (avoids duplicate controls).
  els.effectParams.hidden = !!inlineHost;
  els.maskTools.hidden = false;

  const title = document.createElement('div');
  title.className = 'stack-params-title';
  title.textContent = `Settings · ${fx.constructor.label}`;
  mount.appendChild(title);

  const opWrap = document.createElement('div');
  opWrap.innerHTML = `<label class="field-label">Opacity <span class="field-value">${Math.round(fx.opacity * 100)}%</span></label>`;
  const op = document.createElement('input');
  op.type = 'range'; op.min = '0'; op.max = '1'; op.step = '0.01'; op.value = String(fx.opacity);
  op.addEventListener('input', () => {
    fx.opacity = Number(op.value);
    opWrap.querySelector('.field-value').textContent = `${Math.round(fx.opacity * 100)}%`;
    scheduleRender();
  });
  opWrap.appendChild(op);
  mount.appendChild(opWrap);

  const blendWrap = document.createElement('div');
  blendWrap.innerHTML = `<label class="field-label">Blend mode</label>`;
  const blend = document.createElement('select');
  for (const b of PIPELINE_BLENDS) {
    const o = document.createElement('option');
    o.value = b.id;
    o.textContent = b.label;
    if (b.id === fx.blend) o.selected = true;
    blend.appendChild(o);
  }
  blend.addEventListener('change', () => {
    fx.blend = blend.value;
    scheduleRender();
  });
  blendWrap.appendChild(blend);
  mount.appendChild(blendWrap);

  const schema = paramSchema(fx);
  for (const [key, meta] of Object.entries(schema)) {
    mount.appendChild(paramControl(fx, key, meta));
  }

  // Ensure the controls are visible inside the scrolling panel.
  requestAnimationFrame(() => {
    const row = inlineHost?.closest('.stack-item') || mount;
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function bindEffectStack() {
  refreshEffectAddSelect();
  refreshStackList();
  renderEffectParams();

  els.effectAddBtn.addEventListener('click', () => {
    const type = els.effectAddSelect.value;
    const fx = state.stack.add(type);
    state.selectedEffectId = fx.id;
    openPanelBlock('grade');
    refreshStackList();
    renderEffectParams();
    scheduleRender();
    setStatus('ready', `Added ${fx.constructor.label}. Turn Off or Remove anytime.`);
  });

  els.clearStackBtn?.addEventListener('click', () => {
    clearEffectStack();
  });

  els.maskSize.addEventListener('input', () => {
    state.maskBrush.size = Number(els.maskSize.value);
    els.maskSizeValue.textContent = String(state.maskBrush.size);
  });
  els.maskHard.addEventListener('input', () => {
    state.maskBrush.hardness = Number(els.maskHard.value) / 100;
    els.maskHardValue.textContent = `${els.maskHard.value}%`;
  });

  const setMaskMode = (mode) => {
    state.maskMode = mode;
    els.canvas.classList.toggle('masking', !!mode);
    els.maskPaintBtn.classList.toggle('primary', mode === 'paint');
    els.maskEraseBtn.classList.toggle('primary', mode === 'erase');
    render();
  };
  els.maskPaintBtn.addEventListener('click', () => setMaskMode(state.maskMode === 'paint' ? null : 'paint'));
  els.maskEraseBtn.addEventListener('click', () => setMaskMode(state.maskMode === 'erase' ? null : 'erase'));
  els.maskClearBtn.addEventListener('click', () => {
    const fx = state.stack.get(state.selectedEffectId);
    if (!fx || !state.w) return;
    ensureMask(fx, state.w, state.h);
    clearMask(fx.mask, '#ffffff');
    render();
  });

  els.exportLutBtn.addEventListener('click', () => {
    const cube = exportCubeLUT(state.stack, 33, 'Backtext');
    downloadText('backtext.cube', cube);
  });
}

function bindControls() {
  bindPanelAccordion();
  bindVideoDuration();
  syncVideoFormatHint();
  bindEffectChips();
  bindEffectStack();
  bindPaperControls();
  bindSubjectMotionControls();
  syncPaperControls();
  syncSubjectMotionControls();
  els.textInput.addEventListener('input', () => { state.text = els.textInput.value; render(); });

  els.fontSelect.addEventListener('change', () => {
    state.font = els.fontSelect.value;
    document.fonts.load(`${state.size}px "${state.font}"`).then(render);
  });

  els.sizeRange.addEventListener('input', () => {
    state.size = Number(els.sizeRange.value);
    syncLabels();
    render();
  });

  els.rotationRange.addEventListener('input', () => {
    state.rotation = Number(els.rotationRange.value);
    syncLabels();
    render();
  });

  els.posXRange.addEventListener('input', () => {
    state.x = Number(els.posXRange.value) / 100;
    syncLabels();
    render();
  });

  els.posYRange.addEventListener('input', () => {
    state.y = Number(els.posYRange.value) / 100;
    syncLabels();
    render();
  });

  els.spacingRange.addEventListener('input', () => {
    state.letterSpacing = Number(els.spacingRange.value);
    syncLabels();
    render();
  });

  els.lineHeightRange.addEventListener('input', () => {
    state.lineHeight = Number(els.lineHeightRange.value) / 100;
    syncLabels();
    render();
  });

  els.opacityRange.addEventListener('input', () => {
    state.opacity = Number(els.opacityRange.value) / 100;
    syncLabels();
    render();
  });

  els.colorInput.addEventListener('input', () => { state.color = els.colorInput.value; render(); });
  els.color2Input.addEventListener('input', () => { state.color2 = els.color2Input.value; render(); });

  els.blendSelect.addEventListener('change', () => {
    state.blend = els.blendSelect.value;
    render();
  });
  els.patternSelect.addEventListener('change', () => {
    state.pattern = els.patternSelect.value;
    render();
  });

  els.swatches.addEventListener('click', (e) => {
    const btn = e.target.closest('.swatch');
    if (!btn) return;
    state.color = btn.dataset.color;
    els.colorInput.value = btn.dataset.color;
    render();
  });

  const onToggle = (el, fn) => {
    el.addEventListener('change', () => {
      lockDocumentScroll();
      fn();
    });
  };

  onToggle(els.behindToggle, () => render());
  onToggle(els.stickerToggle, () => {
    state.sticker = els.stickerToggle.checked;
    invalidateSubjectBitmap();
    render();
  });
  onToggle(els.breakoutToggle, () => {
    state.breakout = els.breakoutToggle.checked;
    render();
  });
  onToggle(els.parallaxToggle, () => {
    state.parallax = els.parallaxToggle.checked;
    ensureAnimLoop();
    render();
  });
  onToggle(els.shadowToggle, () => {
    state.shadow = els.shadowToggle.checked;
    render();
  });
  onToggle(els.strokeToggle, () => {
    state.stroke = els.strokeToggle.checked;
    render();
  });

  els.resetBtn.addEventListener('click', () => {
    Object.assign(state, {
      ...DEFAULTS,
      paper: { ...PAPER_DEFAULTS },
      subjectPaper: { ...PAPER_DEFAULTS },
      subjectEffect: 'none',
      subjectMotion: 'none',
      subjectMotionAmount: 0.55,
    });
    clearEffectStack();
    invalidateSubjectBitmap();
    els.textInput.value = DEFAULTS.text;
    els.fontSelect.value = DEFAULTS.font;
    els.colorInput.value = DEFAULTS.color;
    els.color2Input.value = DEFAULTS.color2;
    els.blendSelect.value = DEFAULTS.blend;
    els.patternSelect.value = DEFAULTS.pattern;
    els.rotationRange.value = String(DEFAULTS.rotation);
    els.spacingRange.value = String(DEFAULTS.letterSpacing);
    els.lineHeightRange.value = String(Math.round(DEFAULTS.lineHeight * 100));
    els.opacityRange.value = String(Math.round(DEFAULTS.opacity * 100));
    els.shadowToggle.checked = DEFAULTS.shadow;
    els.strokeToggle.checked = DEFAULTS.stroke;
    els.stickerToggle.checked = DEFAULTS.sticker;
    els.breakoutToggle.checked = DEFAULTS.breakout;
    els.parallaxToggle.checked = DEFAULTS.parallax;
    if (state.srcCanvas) {
      state.size = Math.round(state.w * 0.22);
      els.sizeRange.value = String(state.size);
      state.letterSpacing = Math.round(state.w * 0.012);
      els.spacingRange.value = String(state.letterSpacing);
      state.x = 0.5;
      state.y = 0.42;
      syncPositionSliders();
    }
    syncEffectChips();
    syncPaperControls();
    syncSubjectMotionControls();
    ensureAnimLoop();
    syncLabels();
    render();
    setStatus('ready', 'Style reset.');
  });

  const pngBtns = [els.downloadBtn, els.downloadBtnDock].filter(Boolean);
  for (const btn of pngBtns) btn.addEventListener('click', downloadPng);
  const vidBtns = [els.downloadVideoBtn, els.downloadVideoBtnDock].filter(Boolean);
  for (const btn of vidBtns) btn.addEventListener('click', () => { downloadVideo(); });
}

/* ---------------- canvas drag / resize ---------------- */

function canvasPoint(e) {
  const rect = els.canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * state.w,
    y: ((e.clientY - rect.top) / rect.height) * state.h,
  };
}

function textHitBox() {
  // Approximate the text block in canvas space for hit-testing.
  const m = document.createElement('canvas').getContext('2d');
  applyFont(m);
  const lines = state.text.split('\n');
  let maxW = 1;
  for (const line of lines) maxW = Math.max(maxW, m.measureText(line).width);
  const lh = state.size * state.lineHeight;
  const halfH = ((lines.length - 1) * lh) / 2 + state.size * 0.62 + 14;
  return { halfW: maxW / 2 + 14, halfH };
}

function pointInText(px, py) {
  const cx = state.x * state.w;
  const cy = state.y * state.h;
  const r = (-state.rotation * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  const lx = dx * Math.cos(r) - dy * Math.sin(r);
  const ly = dx * Math.sin(r) + dy * Math.cos(r);
  const { halfW, halfH } = textHitBox();
  return Math.abs(lx) <= halfW && Math.abs(ly) <= halfH;
}

function bindCanvasGestures() {
  let dragging = false;
  let masking = false;
  let grabOffset = { x: 0, y: 0 };

  els.canvas.addEventListener('pointerdown', (e) => {
    if (!state.srcCanvas) return;
    const p = canvasPoint(e);

    if (state.maskMode && state.selectedEffectId) {
      const fx = state.stack.get(state.selectedEffectId);
      if (!fx) return;
      ensureMask(fx, state.w, state.h);
      masking = true;
      state.lastMaskPt = p;
      paintMaskStroke(fx.mask, p.x, p.y, p.x, p.y, {
        size: state.maskBrush.size,
        hardness: state.maskBrush.hardness,
        erase: state.maskMode === 'erase',
      });
      els.canvas.setPointerCapture(e.pointerId);
      render();
      return;
    }

    if (!state.text.trim()) return;
    dragging = true;
    grabOffset = { x: p.x - state.x * state.w, y: p.y - state.y * state.h };
    els.canvas.setPointerCapture(e.pointerId);
    els.canvas.classList.add('dragging');
  });

  els.canvas.addEventListener('pointermove', (e) => {
    if (!state.srcCanvas) return;
    const p = canvasPoint(e);
    const rect = els.canvas.getBoundingClientRect();
    state.pointerX = (e.clientX - rect.left) / rect.width;
    state.pointerY = (e.clientY - rect.top) / rect.height;

    if (masking && state.maskMode && state.selectedEffectId) {
      const fx = state.stack.get(state.selectedEffectId);
      if (fx?.mask && state.lastMaskPt) {
        paintMaskStroke(fx.mask, state.lastMaskPt.x, state.lastMaskPt.y, p.x, p.y, {
          size: state.maskBrush.size,
          hardness: state.maskBrush.hardness,
          erase: state.maskMode === 'erase',
        });
        state.lastMaskPt = p;
        render();
      }
      return;
    }

    if (state.finish === 'castShadow' && !dragging) {
      state.lightX = state.pointerX;
      state.lightY = state.pointerY;
      render();
    }
    if (dragging) {
      state.x = Math.min(1.15, Math.max(-0.15, (p.x - grabOffset.x) / state.w));
      state.y = Math.min(1.15, Math.max(-0.15, (p.y - grabOffset.y) / state.h));
      syncPositionSliders();
      syncLabels();
      render();
    } else if (state.text.trim()) {
      els.canvas.classList.toggle('text-hover', pointInText(p.x, p.y));
    }
    if (state.parallax && !dragging) render();
  });

  const endDrag = () => {
    dragging = false;
    masking = false;
    state.lastMaskPt = null;
    els.canvas.classList.remove('dragging');
  };
  els.canvas.addEventListener('pointerup', endDrag);
  els.canvas.addEventListener('pointercancel', endDrag);

  els.canvas.addEventListener('wheel', (e) => {
    if (!state.srcCanvas || state.maskMode) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    const max = Number(els.sizeRange.max) || 1000;
    state.size = Math.round(Math.min(max, Math.max(8, state.size * factor)));
    els.sizeRange.value = String(state.size);
    syncLabels();
    render();
  }, { passive: false });
}

/* ---------------- file inputs / drag & drop ---------------- */

function bindFileInputs() {
  // Upload buttons are <label for="fileInput"> — native picker, no JS click needed.
  els.sampleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadSample();
  });
  els.dropSampleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadSample();
  });
  els.fileInput.addEventListener('change', () => {
    handleFiles(els.fileInput.files);
    els.fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((name) =>
    document.addEventListener(name, (e) => {
      e.preventDefault();
      els.dropzone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((name) =>
    document.addEventListener(name, (e) => {
      e.preventDefault();
      if (e.target === document || !els.dropzone.contains(e.target)) {
        els.dropzone.classList.remove('dragover');
      }
    })
  );
  document.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
}

/* ---------------- boot ---------------- */

/** Keep the document pinned — focusing bottom panel controls must not pan the page. */
function lockDocumentScroll() {
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (_) { /* ignore */ }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function boot() {
  try {
    lockDocumentScroll();
    if (window.lucide) window.lucide.createIcons();
    document.fonts.ready.then(() => render());
    bindControls();
    setSignatureRedraw(() => {
      ensureAnimLoop();
      render(performance.now());
    });
    bindCanvasGestures();
    bindFileInputs();
    syncLabels();
    showProcessing(false);
    window.backtextLoadSample = loadSample;
    window.addEventListener('resize', () => {
      lockDocumentScroll();
      fitCanvasToStage();
    });
    window.addEventListener('scroll', lockDocumentScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined' && els.stage) {
      new ResizeObserver(() => fitCanvasToStage()).observe(els.stage);
    }
  } catch (err) {
    console.error('Backtext failed to start:', err);
    setStatus('error', 'App failed to start — check the console.');
  }
}

boot();