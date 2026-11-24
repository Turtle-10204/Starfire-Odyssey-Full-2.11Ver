// =====================================================================
// input.js — 輸入：手機虛擬按鍵（含自訂配置系統）、點擊分派、鍵盤事件。
// =====================================================================

let mobileDashLocked = false;

let dashToggleActive = false;

// 手機觸控虛擬按鍵狀態
let touchControls = {
  left: false,
  right: false,
  down: false,
  jump: false,
  fire: false
};

let prevTouchJump = false;

let prevTouchFire = false;

// 手機按鍵自訂系統全域設定與編輯器狀態
const MOBILE_CONTROLS_STORAGE_KEY = "starfire_odyssey_mobile_controls_v1";
const MOBILE_BUTTON_KEYS = ["left", "right", "down", "jump", "fire", "dash"];

let mobileControlsConfig = null;
let mobileControlsConfigLoaded = false;
let mobileControlsBackupConfig = null;

let draggingMobileBtnKey = null;
let draggingTouchId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let activeEditorSlider = null; // "size" | "alpha" | null

function resetMobileTouchState() {
  touchControls = { left: false, right: false, down: false, jump: false, fire: false };
  prevTouchJump = false;
  prevTouchFire = false;
  draggingMobileBtnKey = null;
  draggingTouchId = null;
  activeEditorSlider = null;
}

function getDefaultMobileControlsConfig(refW, refH) {
  let w = max(320, refW || width || 800);
  let h = max(240, refH || height || 450);
  let shortSide = min(w, h);
  let baseR = constrain(shortSide * 0.085, 32, 50);
  let padMargin = baseR + 22;
  let bottomY = h - baseR - 18;

  const toNorm = (px, py, rPx) => ({
    x: constrain(px / w, 0.04, 0.96),
    y: constrain(py / h, 0.08, 0.96),
    r: constrain(rPx / shortSide, 0.045, 0.16),
    alpha: 0.85
  });

  return {
    sizeRatio: constrain(baseR / shortSide, 0.055, 0.14),
    alpha: 0.85,
    buttons: {
      left:  toNorm(padMargin, bottomY - baseR * 0.35, baseR),
      right: toNorm(padMargin + baseR * 2.25, bottomY - baseR * 0.35, baseR),
      down:  toNorm(padMargin + baseR * 1.12, bottomY + baseR * 0.65, baseR * 0.85),
      jump:  toNorm(w - padMargin, bottomY - baseR * 0.25, baseR * 1.12),
      fire:  toNorm(w - padMargin - baseR * 2.25, bottomY + baseR * 0.15, baseR * 0.95),
      dash:  toNorm(w - padMargin - baseR * 1.15, bottomY - baseR * 1.75, baseR * 0.85)
    }
  };
}

function cloneMobileControlsConfig(src) {
  let fallback = getDefaultMobileControlsConfig(width, height);
  if (!src || typeof src !== "object") return fallback;
  let copy = {
    sizeRatio: (typeof src.sizeRatio === "number" && isFinite(src.sizeRatio))
      ? constrain(src.sizeRatio, 0.055, 0.14) : fallback.sizeRatio,
    alpha: (typeof src.alpha === "number" && isFinite(src.alpha))
      ? constrain(src.alpha, 0.25, 1.0) : fallback.alpha,
    buttons: {}
  };
  for (let k of MOBILE_BUTTON_KEYS) {
    let defB = fallback.buttons[k];
    let b = (src.buttons && src.buttons[k] && typeof src.buttons[k] === "object") ? src.buttons[k] : defB;
    copy.buttons[k] = {
      x: (typeof b.x === "number" && isFinite(b.x)) ? constrain(b.x, 0.03, 0.97) : defB.x,
      y: (typeof b.y === "number" && isFinite(b.y)) ? constrain(b.y, 0.06, 0.97) : defB.y,
      r: (typeof b.r === "number" && isFinite(b.r)) ? constrain(b.r, 0.04, 0.18) : defB.r,
      alpha: (typeof b.alpha === "number" && isFinite(b.alpha)) ? constrain(b.alpha, 0.25, 1.0) : copy.alpha
    };
  }
  return copy;
}

function saveMobileControlsConfig() {
  try {
    if (!mobileControlsConfig) {
      mobileControlsConfig = getDefaultMobileControlsConfig(width, height);
    }
    let validated = cloneMobileControlsConfig(mobileControlsConfig);
    mobileControlsConfig = validated;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(MOBILE_CONTROLS_STORAGE_KEY, JSON.stringify(validated));
    }
    return true;
  } catch (err) {
    console.warn("[MobileControls] 儲存設定失敗，已保留記憶體設定：", err);
    return false;
  }
}

function loadMobileControlsConfig() {
  let defaults = getDefaultMobileControlsConfig(width, height);
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      mobileControlsConfig = defaults;
      mobileControlsConfigLoaded = true;
      return mobileControlsConfig;
    }
    let raw = window.localStorage.getItem(MOBILE_CONTROLS_STORAGE_KEY);
    if (!raw || typeof raw !== "string") {
      mobileControlsConfig = defaults;
      mobileControlsConfigLoaded = true;
      return mobileControlsConfig;
    }
    let parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.buttons || typeof parsed.buttons !== "object") {
      mobileControlsConfig = defaults;
      mobileControlsConfigLoaded = true;
      return mobileControlsConfig;
    }

    let safeConfig = {
      sizeRatio: (typeof parsed.sizeRatio === "number" && isFinite(parsed.sizeRatio) && parsed.sizeRatio >= 0.055 && parsed.sizeRatio <= 0.14)
        ? parsed.sizeRatio : defaults.sizeRatio,
      alpha: (typeof parsed.alpha === "number" && isFinite(parsed.alpha) && parsed.alpha >= 0.25 && parsed.alpha <= 1.0)
        ? parsed.alpha : defaults.alpha,
      buttons: {}
    };

    for (let k of MOBILE_BUTTON_KEYS) {
      let defBtn = defaults.buttons[k];
      let item = parsed.buttons[k];
      if (!item || typeof item !== "object") {
        safeConfig.buttons[k] = { ...defBtn };
        continue;
      }
      let nx = (typeof item.x === "number" && isFinite(item.x) && item.x >= 0.02 && item.x <= 0.98)
        ? item.x : defBtn.x;
      let ny = (typeof item.y === "number" && isFinite(item.y) && item.y >= 0.05 && item.y <= 0.98)
        ? item.y : defBtn.y;
      let nr = (typeof item.r === "number" && isFinite(item.r) && item.r >= 0.04 && item.r <= 0.18)
        ? item.r : defBtn.r;
      let na = (typeof item.alpha === "number" && isFinite(item.alpha) && item.alpha >= 0.25 && item.alpha <= 1.0)
        ? item.alpha : safeConfig.alpha;

      safeConfig.buttons[k] = { x: nx, y: ny, r: nr, alpha: na };
    }

    mobileControlsConfig = safeConfig;
    mobileControlsConfigLoaded = true;
    return mobileControlsConfig;
  } catch (err) {
    console.warn("[MobileControls] 讀取設定異常，已安全回退預設配置：", err);
    mobileControlsConfig = defaults;
    mobileControlsConfigLoaded = true;
    return mobileControlsConfig;
  }
}

function ensureMobileControlsConfigReady() {
  if (!mobileControlsConfigLoaded || !mobileControlsConfig) {
    loadMobileControlsConfig();
  }
}

function enterMobileControlsEditor() {
  ensureMobileControlsConfigReady();
  mobileControlsBackupConfig = cloneMobileControlsConfig(mobileControlsConfig);
  resetMobileTouchState();
  showSettingsModal = false;
  isEditingMobileControls = true;
}

function exitMobileControlsEditor(mode) {
  if (mode === "SAVE") {
    saveMobileControlsConfig();
  } else if (mode === "CANCEL" && mobileControlsBackupConfig) {
    mobileControlsConfig = cloneMobileControlsConfig(mobileControlsBackupConfig);
  }
  mobileControlsBackupConfig = null;
  resetMobileTouchState();
  isEditingMobileControls = false;
}

function resetMobileControlsToDefaultInEditor() {
  mobileControlsConfig = getDefaultMobileControlsConfig(width, height);
  draggingMobileBtnKey = null;
  draggingTouchId = null;
}

// =====================================================================
// 手機版多點觸控虛擬按鍵系統 (Mobile Virtual Controls)
// =====================================================================
function getMobileButtonsLayout() {
  ensureMobileControlsConfigReady();
  let cfg = mobileControlsConfig;
  let shortSide = min(width, height);
  let defaultShortR = constrain(shortSide * 0.085, 32, 50);
  let sizeScale = constrain((cfg.sizeRatio * shortSide) / defaultShortR, 0.65, 1.55);
  let globalAlpha = constrain(cfg.alpha, 0.25, 1.0);

  const meta = {
    left:  { mult: 1.00, label: "◀", fillRGB: [255, 255, 255], baseFillA: 0.33 },
    right: { mult: 1.00, label: "▶", fillRGB: [255, 255, 255], baseFillA: 0.33 },
    down:  { mult: 0.85, label: "▼", fillRGB: [255, 255, 255], baseFillA: 0.28 },
    jump:  { mult: 1.12, label: "JUMP", fillRGB: [52, 199, 89], baseFillA: 0.48 },
    fire:  { mult: 0.95, label: "FIRE", fillRGB: [255, 59, 48], baseFillA: 0.48 },
    dash:  { mult: 0.85, label: mobileDashLocked ? "DASH:\nON" : "DASH:\nOFF", fillRGB: [50, 173, 230], baseFillA: 0.42 }
  };

  let layout = {};
  for (let k of MOBILE_BUTTON_KEYS) {
    let bCfg = cfg.buttons[k];
    let m = meta[k];
    let rPx = constrain(defaultShortR * m.mult * sizeScale, 22, min(width, height) * 0.22);
    let xPx = constrain(bCfg.x * width, rPx + 6, max(rPx + 6, width - rPx - 6));
    let yPx = constrain(bCfg.y * height, rPx + 6, max(rPx + 6, height - rPx - 6));
    let a = constrain(globalAlpha, 0.25, 1.0);

    layout[k] = {
      x: xPx,
      y: yPx,
      r: rPx,
      alpha: a,
      label: m.label,
      color: `rgba(${m.fillRGB[0]}, ${m.fillRGB[1]}, ${m.fillRGB[2]}, ${(m.baseFillA * (a / 0.85)).toFixed(3)})`
    };
  }
  return layout;
}

function updateMobileTouchState() {
  // 編輯模式與死亡動畫期間完全隔離遊戲輸入並清空虛擬按鍵狀態
  if (isEditingMobileControls || gameState === "DYING_ANIMATION") {
    touchControls = { left: false, right: false, down: false, jump: false, fire: false };
    prevTouchJump = false;
    prevTouchFire = false;
    return;
  }

  let activePointers = [];
  if (touches && touches.length > 0) {
    for (let t of touches) activePointers.push({ x: t.x, y: t.y });
  }
  if (mouseIsPressed) {
    activePointers.push({ x: mouseX, y: mouseY });
  }

  let nextState = { left: false, right: false, down: false, jump: false, fire: false };

  if (gameState === "PLAYING" && !showSettingsModal && !showExitMapConfirmModal) {
    let layout = getMobileButtonsLayout();
    for (let pt of activePointers) {
      if (dist(pt.x, pt.y, layout.left.x, layout.left.y) < layout.left.r * 1.28) nextState.left = true;
      if (dist(pt.x, pt.y, layout.right.x, layout.right.y) < layout.right.r * 1.28) nextState.right = true;
      if (dist(pt.x, pt.y, layout.down.x, layout.down.y) < layout.down.r * 1.25) nextState.down = true;
      if (dist(pt.x, pt.y, layout.jump.x, layout.jump.y) < layout.jump.r * 1.25) nextState.jump = true;
      if (dist(pt.x, pt.y, layout.fire.x, layout.fire.y) < layout.fire.r * 1.25) nextState.fire = true;
    }

    if (nextState.jump && !prevTouchJump) {
      triggerJumpAction();
    }
    if (!nextState.jump && prevTouchJump) {
      if (velocityY < 0 && powerType !== "feather" && wallJumpLockTimer <= 0) {
        velocityY = 0;
        isShortJump = true;
      }
    }
    if (nextState.fire && !prevTouchFire) {
      triggerFireAction();
    }
  }

  prevTouchJump = nextState.jump;
  prevTouchFire = nextState.fire;
  touchControls = nextState;
}

function drawMobileControls() {
  let layout = getMobileButtonsLayout();
  push();
  textFont("Arial Black, sans-serif");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  for (let keyName in layout) {
    let b = layout[keyName];
    let a = b.alpha;
    let isPressed = (keyName === "dash") ? mobileDashLocked : touchControls[keyName];

    if (keyName === "dash") {
      if (mobileDashLocked) {
        noFill();
        stroke(255, 209, 102, 235 * a);
        strokeWeight(2);
        ellipse(b.x, b.y, b.r * 2 + 10, b.r * 2 + 10);

        stroke(255, 209, 102, 255 * a);
        strokeWeight(4.5);
        fill(0, 150, 199, 210 * a);
        ellipse(b.x, b.y, b.r * 2, b.r * 2);

        push();
        translate(b.x + b.r * 0.68, b.y - b.r * 0.68);
        fill(255, 209, 102, 255 * a);
        stroke(29, 45, 68, 255 * a);
        strokeWeight(1.5);
        ellipse(0, 0, 16, 16);
        noStroke();
        fill(29, 45, 68, 255 * a);
        triangle(-1, -5, 4, -1, 0, -1);
        triangle(1, 5, -4, 1, 0, 1);
        pop();
      } else {
        stroke(255, 255, 255, 145 * a);
        strokeWeight(2);
        fill(30, 41, 59, 145 * a);
        ellipse(b.x, b.y, b.r * 2, b.r * 2);

        noStroke();
        fill(255, 255, 255, 145 * a);
        ellipse(b.x, b.y - b.r * 0.72, 6, 6);
      }

      noStroke();
      fill(255, 255, 255, (mobileDashLocked ? 255 : 215) * a);
      textSize(b.r * 0.32);
      textLeading(b.r * 0.36);
      text(b.label, b.x, b.y + 2);
      continue;
    }

    stroke(isPressed ? color(255, 209, 102, 255 * a) : color(255, 255, 255, 175 * a));
    strokeWeight(isPressed ? 4 : 2.5);
    fill(isPressed ? color(255, 215, 0, 165 * a) : b.color);
    ellipse(b.x, b.y, b.r * 2, b.r * 2);

    noStroke();
    fill(255, 255, 255, (isPressed ? 255 : 225) * a);
    textSize(b.label.length > 1 ? b.r * 0.42 : b.r * 0.65);
    text(b.label, b.x, b.y + 1);
  }
  pop();
}

// =====================================================================
// 手機按鍵自訂編輯器 UI 與拖曳互動 (Mobile Controls Editor)
// =====================================================================
function getMobileControlsEditorRects() {
  let barW = min(560, width * 0.94);
  let compact = (height < 430);
  let barH = compact ? 104 : 118;
  let bx = width / 2 - barW / 2;
  let by = compact ? 8 : 14;

  let sliderX = bx + 118;
  let sliderW = barW - 186;
  let row1Y = by + (compact ? 34 : 40);
  let row2Y = by + (compact ? 58 : 66);

  let btnW = (barW - 44) / 3;
  let btnH = compact ? 28 : 32;
  let btnY = by + barH - btnH - 8;

  return {
    bx, by, barW, barH, compact,
    sizeSlider:  { x: sliderX, y: row1Y - 10, w: sliderW, h: 20, trackY: row1Y },
    alphaSlider: { x: sliderX, y: row2Y - 10, w: sliderW, h: 20, trackY: row2Y },
    resetBtn:    { x: bx + 12, y: btnY, w: btnW, h: btnH },
    cancelBtn:   { x: bx + 22 + btnW, y: btnY, w: btnW, h: btnH },
    saveBtn:     { x: bx + 32 + btnW * 2, y: btnY, w: btnW, h: btnH }
  };
}

function applyEditorSliderAtX(sliderType, px) {
  ensureMobileControlsConfigReady();
  let r = getMobileControlsEditorRects();
  let s = (sliderType === "size") ? r.sizeSlider : r.alphaSlider;
  let t = constrain((px - s.x) / max(1, s.w), 0, 1);

  if (sliderType === "size") {
    mobileControlsConfig.sizeRatio = lerp(0.055, 0.14, t);
    let shortSide = min(width, height);
    let defaultShortR = constrain(shortSide * 0.085, 32, 50);
    let sizeScale = constrain((mobileControlsConfig.sizeRatio * shortSide) / defaultShortR, 0.65, 1.55);
    const mults = { left: 1.0, right: 1.0, down: 0.85, jump: 1.12, fire: 0.95, dash: 0.85 };
    for (let k of MOBILE_BUTTON_KEYS) {
      mobileControlsConfig.buttons[k].r = constrain((defaultShortR * mults[k] * sizeScale) / shortSide, 0.04, 0.18);
    }
  } else if (sliderType === "alpha") {
    let newAlpha = lerp(0.25, 1.0, t);
    mobileControlsConfig.alpha = newAlpha;
    for (let k of MOBILE_BUTTON_KEYS) {
      mobileControlsConfig.buttons[k].alpha = newAlpha;
    }
  }
}

function updateDraggedMobileButton(px, py) {
  if (!draggingMobileBtnKey) return;
  ensureMobileControlsConfigReady();
  let layout = getMobileButtonsLayout();
  let btn = layout[draggingMobileBtnKey];
  if (!btn) return;

  let rPx = btn.r;
  let clampedX = constrain(px + dragOffsetX, rPx + 6, max(rPx + 6, width - rPx - 6));
  let clampedY = constrain(py + dragOffsetY, rPx + 6, max(rPx + 6, height - rPx - 6));

  mobileControlsConfig.buttons[draggingMobileBtnKey].x = constrain(clampedX / max(1, width), 0.02, 0.98);
  mobileControlsConfig.buttons[draggingMobileBtnKey].y = constrain(clampedY / max(1, height), 0.05, 0.98);
}

function handleMobileEditorPointerDown(px, py, touchId = null) {
  if (draggingMobileBtnKey !== null || activeEditorSlider !== null) return;
  let r = getMobileControlsEditorRects();
  const inRect = (b) => (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);

  if (inRect(r.saveBtn)) {
    exitMobileControlsEditor("SAVE");
    playSFX("powerup");
    return;
  }
  if (inRect(r.cancelBtn)) {
    exitMobileControlsEditor("CANCEL");
    playSFX("mapMove");
    return;
  }
  if (inRect(r.resetBtn)) {
    resetMobileControlsToDefaultInEditor();
    playSFX("mapMove");
    return;
  }
  if (inRect(r.sizeSlider)) {
    activeEditorSlider = "size";
    draggingTouchId = touchId;
    applyEditorSliderAtX("size", px);
    return;
  }
  if (inRect(r.alphaSlider)) {
    activeEditorSlider = "alpha";
    draggingTouchId = touchId;
    applyEditorSliderAtX("alpha", px);
    return;
  }

  let layout = getMobileButtonsLayout();
  let bestKey = null;
  let bestDist = Infinity;
  for (let k of MOBILE_BUTTON_KEYS) {
    let b = layout[k];
    let d = dist(px, py, b.x, b.y);
    if (d <= b.r * 1.15 && d < bestDist) {
      bestDist = d;
      bestKey = k;
    }
  }
  if (bestKey) {
    draggingMobileBtnKey = bestKey;
    draggingTouchId = touchId;
    dragOffsetX = layout[bestKey].x - px;
    dragOffsetY = layout[bestKey].y - py;
    playSFX("mapMove");
  }
}

function drawMobileControlsEditor() {
  ensureMobileControlsConfigReady();
  let r = getMobileControlsEditorRects();

  push();
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);

  // 繪製即時預覽的所有虛擬按鍵與拖曳外框提示
  drawMobileControls();

  let layout = getMobileButtonsLayout();
  noFill();
  for (let k of MOBILE_BUTTON_KEYS) {
    let b = layout[k];
    let isDragging = (draggingMobileBtnKey === k);
    stroke(isDragging ? "#34C759" : "rgba(255, 209, 102, 0.75)");
    strokeWeight(isDragging ? 3.5 : 1.5);
    ellipse(b.x, b.y, b.r * 2 + 12, b.r * 2 + 12);
  }

  // 頂部控制工具列
  stroke("#FFD166");
  strokeWeight(3);
  fill(20, 32, 52, 238);
  rect(r.bx, r.by, r.barW, r.barH, 14);

  noStroke();
  fill("#FFD166");
  textFont("sans-serif");
  textStyle(BOLD);
  textSize(r.compact ? 13 : 15);
  textAlign(CENTER, TOP);
  text("📱 手機按鍵自訂配置（直接拖曳下方按鍵調整位置）", width / 2, r.by + 6);

  // 大小滑桿
  let sizeT = constrain((mobileControlsConfig.sizeRatio - 0.055) / (0.14 - 0.055), 0, 1);
  let sizePct = Math.round(lerp(65, 155, sizeT));
  fill("#E2E8F0");
  textSize(r.compact ? 11.5 : 12.5);
  textAlign(LEFT, CENTER);
  text("按鍵大小", r.bx + 16, r.sizeSlider.trackY);
  textAlign(RIGHT, CENTER);
  text(`${sizePct}%`, r.bx + r.barW - 14, r.sizeSlider.trackY);

  fill("#475569");
  rect(r.sizeSlider.x, r.sizeSlider.trackY - 3, r.sizeSlider.w, 6, 3);
  fill("#32ADE6");
  rect(r.sizeSlider.x, r.sizeSlider.trackY - 3, r.sizeSlider.w * sizeT, 6, 3);
  fill("#FFFFFF");
  stroke("#1E293B");
  strokeWeight(2);
  ellipse(r.sizeSlider.x + r.sizeSlider.w * sizeT, r.sizeSlider.trackY, 16, 16);

  // 透明度滑桿
  let alphaT = constrain((mobileControlsConfig.alpha - 0.25) / (1.0 - 0.25), 0, 1);
  let alphaPct = Math.round(mobileControlsConfig.alpha * 100);
  noStroke();
  fill("#E2E8F0");
  textAlign(LEFT, CENTER);
  text("按鍵透明度", r.bx + 16, r.alphaSlider.trackY);
  textAlign(RIGHT, CENTER);
  text(`${alphaPct}%`, r.bx + r.barW - 14, r.alphaSlider.trackY);

  fill("#475569");
  rect(r.alphaSlider.x, r.alphaSlider.trackY - 3, r.alphaSlider.w, 6, 3);
  fill("#34C759");
  rect(r.alphaSlider.x, r.alphaSlider.trackY - 3, r.alphaSlider.w * alphaT, 6, 3);
  fill("#FFFFFF");
  stroke("#1E293B");
  strokeWeight(2);
  ellipse(r.alphaSlider.x + r.alphaSlider.w * alphaT, r.alphaSlider.trackY, 16, 16);

  // 底部三顆按鈕：恢復預設 / 取消 / 保存
  noStroke();
  fill("#64748B");
  rect(r.resetBtn.x, r.resetBtn.y, r.resetBtn.w, r.resetBtn.h, 8);
  fill("#E63946");
  rect(r.cancelBtn.x, r.cancelBtn.y, r.cancelBtn.w, r.cancelBtn.h, 8);
  fill("#34C759");
  rect(r.saveBtn.x, r.saveBtn.y, r.saveBtn.w, r.saveBtn.h, 8);

  fill("#FFFFFF");
  textSize(r.compact ? 12 : 13);
  textAlign(CENTER, CENTER);
  text("↺ 恢復預設", r.resetBtn.x + r.resetBtn.w / 2, r.resetBtn.y + r.resetBtn.h / 2);
  text("✖ 取消", r.cancelBtn.x + r.cancelBtn.w / 2, r.cancelBtn.y + r.cancelBtn.h / 2);
  text("✔ 保存配置", r.saveBtn.x + r.saveBtn.w / 2, r.saveBtn.y + r.saveBtn.h / 2);
  pop();
}

function triggerJumpAction() {
  if (isEditingMobileControls) return;
  if (isOnGround && !isActionLocked) {
    velocityY = jumpStrength; 
    isShortJump = false; 

    // 偵測腳下是否踩在流沙 ('Q' 或 'V') 裡，若是則改為「掙扎小跳」
    let checkFootR = floor((characterY + prevHitboxH / 2 - 4) / TILE_SIZE);
    let checkFootC = floor(characterX / TILE_SIZE);
    if (levelMap[checkFootR] && (levelMap[checkFootR][checkFootC] === 'Q' || levelMap[checkFootR][checkFootC] === 'V')) {
      velocityY = -5.5;
    }

    playSFX("jump");
  } else if (!isOnGround) {
    // 優先判定無限蹬牆跳（抓牆中或 6 幀離牆寬容補償內）
    if (typeof tryWallJump === "function" && tryWallJump()) {
      return;
    }
    if (powerType === "feather") {
      if (featherFlapsLeft > 0) {
        featherFlapsLeft--;
        velocityY = -13;
        isGliding = true;
        isActionLocked = false;
        playSFX("flap");
      } else {
        isGliding = !isGliding;
      }
    } else {
      isGliding = !isGliding;  
      isActionLocked = false; 
      if (isGliding) {
        if (velocityY > 0) velocityY = 0; 
        else velocityY *= 0.5; 
      }
    }
  }
}

function triggerFireAction() {
  if (isEditingMobileControls) return;
  if (!isAttacking && !isCrouching) {
    isAttacking = true;
    hasFiredThisAttack = false; 
    currentFrame = 0; 
    lastFrameTime = millis();
  }
}

function triggerDropReservedItem() {
  if (isEditingMobileControls) return;
  if (reservedItem && gameState === "PLAYING") {
    let dropType = reservedItem;
    reservedItem = null;
    playSFX("powerup");
    items.push({
      type: dropType,
      x: characterX,
      y: characterY - 3 * TILE_SIZE,
      vx: 2,
      vy: 0,
      size: 32,
      spawnDelay: 500
    });
  }
}
// =====================================================================
// 《New Super Mario Bros. Wii》風格 UI 系統（大地圖 + 過場卡 + 遊戲 HUD）
// =====================================================================

function handlePointerTap(px, py) {
  initAudioEngine();

  if (isEditingMobileControls) {
    handleMobileEditorPointerDown(px, py, null);
    return;
  }

  if (gameState === "DYING_ANIMATION") {
    return;
  }

  if (showSettingsModal) {
    handleSettingsModalClick(px, py);
    return;
  }

  if (showExitMapConfirmModal) {
    handleExitMapConfirmClick(px, py);
    return;
  }

  if (gameState === "ITEM_GUIDE") {
    if (millis() - guideOpenTime > 300) {
      activeGuideData = null;
      gameState = "PLAYING";
      playSFX("mapMove");
    }
    return;
  }

  if (gameState === "DEVICE_SELECT") {
    let tb = getDeviceGuideToggleRect();
    if (px >= tb.x && px <= tb.x + tb.w && py >= tb.y && py <= tb.y + tb.h) {
      showItemGuides = !showItemGuides;
      playSFX("mapMove");
      return;
    }

    let cards = getDeviceSelectCards();
    for (let c of cards) {
      if (px > c.x - c.w / 2 && px < c.x + c.w / 2 &&
          py > c.y - c.h / 2 && py < c.y + c.h / 2) {
        controlMode = c.mode;
        if (controlMode === "MOBILE") autoFitMobileZoom = true;
        playSFX("powerup");
        gameState = "WORLD_MAP";
        return;
      }
    }
    return;
  }

  if (gameState === "WORLD_MAP") {
    // 隱藏角落彩蛋：連點左上角角色頭像 5 下啟動創作者模式
    if (dist(px, py, 50, 102) < 28) {
      if (millis() - devLastTapTime < 800) {
        devTapCount++;
      } else {
        devTapCount = 1;
      }
      devLastTapTime = millis();
      if (devTapCount >= 5) {
        devTapCount = 0;
        activateCreatorDebugMode();
      }
      return;
    }
    if (worldTransition.active) return; // 過場動畫期間鎖定操作

    // 處理補給屋點擊領取
    if (showShopModal) {
      let boxW = min(520, width * 0.90);
      let boxH = min(290, height * 0.80);
      let bx = width / 2 - boxW / 2;
      let by = height / 2 - boxH / 2;
      let slotW = (boxW - 72) / 3;
      let slotH = 120;
      let slotY = by + 95;

      for (let i = 0; i < 3; i++) {
        let sx = bx + 20 + i * (slotW + 16);
        if (px >= sx && px <= sx + slotW && py >= slotY && py <= slotY + slotH) {
          let chosen = shopItems[i];
          if (chosen === "1up") {
            lives++;
            playSFX("1up");
          } else {
            // 若身上還沒有 3 階能力就直接裝備，否則存入上方備用道具框
            if (powerLevel < 3) {
              powerLevel = 3;
              powerType = chosen;
            } else {
              reservedItem = chosen;
            }
            playSFX("powerup");
          }
          // 出店門即關門打烊，直到通過任意關卡才再開門
          mapNodesData["2-SHOP"].isOpen = false;
          showShopModal = false;
          return;
        }
      }
      // 點擊視窗外離開（不領取也算離開店門）
      if (px < bx || px > bx + boxW || py < by || py > by + boxH) {
        mapNodesData["2-SHOP"].isOpen = false;
        showShopModal = false;
        playSFX("mapMove");
      }
      return;
    }

    if (px >= width - 156 && px <= width - 30 && py >= 74 && py <= 108) {
      showSettingsModal = true;
      playSFX("mapMove");
      return;
    }

    let itemBtnW = 135;
    let itemBtnH = 44;
    let itemBtnX = width - itemBtnW - 24;
    let itemBtnY = height - itemBtnH - 20;
    if (px >= itemBtnX && px <= itemBtnX + itemBtnW && py >= itemBtnY && py <= itemBtnY + itemBtnH) {
      showMapItemDrawer = !showMapItemDrawer;
      playSFX("mapMove");
      return;
    }

    if (showMapItemDrawer) {
      showMapItemDrawer = false;
      return;
    }

    let nodes = getWorldMapNodes();
    if (controlMode === "MOBILE") {
      let pad = getMobileMapPadRects();
      const hit = (b) => (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
      for (let k of ["up", "down", "left", "right"]) {
        if (hit(pad[k])) {
          moveWorldMapCursor(pad[k].dir);
          return;
        }
      }
      if (hit(pad.go)) {
        enterSelectedMapNode();
        return;
      }
    }
  

    for (let n of nodes) {
      if (dist(px, py, n.x, n.y) < 42) {
        if (!n.unlocked) {
          playSFX("stomp"); // 未解鎖灰色關卡不可進入
          return;
        }
        if (selectedMapNode === n.id) {
          enterSelectedMapNode();
        } else {
          selectedMapNode = n.id;
          playSFX("mapMove");
        }
        return;
      }
    }
    return;
  }

  if (gameState === "PLAYING") {
    let compact = (height < 460);
    let boxSize = compact ? 46 : 58;
    let boxX = width / 2 - boxSize / 2;
    let boxY = compact ? 10 : 18;
    if (px >= boxX && px <= boxX + boxSize && py >= boxY && py <= boxY + boxSize) {
      triggerDropReservedItem();
      return;
    }
    let tBoxX = boxX + boxSize + 12;
  if (currentWorld === 2 && currentLevel === 4 && px >= tBoxX && px <= tBoxX + boxSize && py >= boxY && py <= boxY + boxSize) {
    placeTorchAtPlayer();
    return;
  }

    let btnY = compact ? 66 : 92;
    if (py >= btnY && py <= btnY + 28) {
      if (px >= width - 166 && px <= width - 96) {
        showSettingsModal = true;
        playSFX("mapMove");
        return;
      } else if (px >= width - 90 && px <= width - 20) {
        showExitMapConfirmModal = true;
        playSFX("mapMove");
        return;
      }
    }

    if (controlMode === "MOBILE") {
      let layout = getMobileButtonsLayout();
      if (dist(px, py, layout.dash.x, layout.dash.y) < layout.dash.r * 1.25) {
        mobileDashLocked = !mobileDashLocked;
        dashToggleActive = mobileDashLocked;
        if (mobileDashLocked && powerLevel === 3 && powerType === "chrono") {
          triggerChronoShockwave();
        }
        playSFX("mapMove");
        return;
      }
    }
  }

  if (gameState === "GAME_OVER" && controlMode === "MOBILE") {
    startLevel(currentLevel, true, false);
  } else if (gameState === "ALL_CLEAR" && controlMode === "MOBILE") {
    exitToWorldMapRestoreEntry();
  }
}

function mousePressed() {
  if (isEditingMobileControls) {
    initAudioEngine();
    handleMobileEditorPointerDown(mouseX, mouseY, null);
    return;
  }
  handlePointerTap(mouseX, mouseY);
}

function mouseDragged() {
  if (isEditingMobileControls) {
    if (activeEditorSlider) {
      applyEditorSliderAtX(activeEditorSlider, mouseX);
    } else if (draggingMobileBtnKey) {
      updateDraggedMobileButton(mouseX, mouseY);
    }
    return false;
  }
}

function mouseReleased() {
  if (isEditingMobileControls) {
    draggingMobileBtnKey = null;
    draggingTouchId = null;
    activeEditorSlider = null;
    return false;
  }
}

function touchStarted() {
  initAudioEngine();
  if (isEditingMobileControls) {
    if (touches && touches.length > 0 && draggingMobileBtnKey === null && activeEditorSlider === null) {
      let t = touches[0];
      handleMobileEditorPointerDown(t.x, t.y, t.id !== undefined ? t.id : 0);
    }
    return false;
  }
  if (touches && touches.length > 0) {
    let lastTouch = touches[touches.length - 1];
    handlePointerTap(lastTouch.x, lastTouch.y);
  }
  return false;
}

function touchMoved() {
  if (isEditingMobileControls) {
    if (touches && touches.length > 0) {
      let tracked = null;
      if (draggingTouchId !== null) {
        tracked = touches.find(t => (t.id !== undefined ? t.id : 0) === draggingTouchId);
      }
      if (!tracked && touches.length === 1) {
        tracked = touches[0];
      }
      if (tracked) {
        if (activeEditorSlider) {
          applyEditorSliderAtX(activeEditorSlider, tracked.x);
        } else if (draggingMobileBtnKey) {
          updateDraggedMobileButton(tracked.x, tracked.y);
        }
      }
    }
    return false;
  }
  return false;
}

function touchEnded() {
  initAudioEngine();
  if (isEditingMobileControls) {
    if (!touches || touches.length === 0) {
      draggingMobileBtnKey = null;
      draggingTouchId = null;
      activeEditorSlider = null;
    } else if (draggingTouchId !== null) {
      let stillActive = touches.some(t => (t.id !== undefined ? t.id : 0) === draggingTouchId);
      if (!stillActive) {
        draggingMobileBtnKey = null;
        draggingTouchId = null;
        activeEditorSlider = null;
      }
    }
    return false;
  }
  return false;
}

let devTapCount = 0;

let devLastTapTime = 0;

let devBannerTimer = 0;

function activateCreatorDebugMode() {
  ["1-1", "1-2", "1-3", "1-4", "2-0", "2-SHOP", "2-1", "2-2", "2-3", "2-4", "2-5"].forEach(id => {
    if (mapNodesData[id]) {
      mapNodesData[id].unlocked = true;
      if (id !== "2-4" && id !== "2-5" && id !== "2-SHOP") mapNodesData[id].cleared = true;
    }
  });

  currentWorld = 2;
  selectedMapNode = "2-4";
  let w2Nodes = getWorldMapNodes();
  let n24 = w2Nodes.find(n => n.id === "2-4");
  if (n24) {
    mapAvatarX = n24.x;
    mapAvatarY = n24.y;
  }

  powerLevel = 3;
  powerType = "speed";
  reservedItem = "speed";
  lives = max(lives, 10);

  devBannerTimer = millis() + 2000;
  playSFX("1up");
}

function keyPressed() { 
  initAudioEngine();

  if (isEditingMobileControls) {
    if (keyCode === ESCAPE && typeof exitMobileControlsEditor === "function") {
      exitMobileControlsEditor("CANCEL");
      playSFX("mapMove");
    }
    return false;
  }

  if (gameState === "DYING_ANIMATION") {
    return;
  }

  if (gameState === "ITEM_GUIDE") {
    if (millis() - guideOpenTime > 200) {
      activeGuideData = null;
      gameState = "PLAYING";
      playSFX("mapMove");
    }
    return;
  }

  if (key === 'o' || key === 'O') {
    if (gameState === "WORLD_MAP" || gameState === "PLAYING") {
      showSettingsModal = !showSettingsModal;
      playSFX("mapMove");
    }
    return;
  }

  if (showSettingsModal) {
    if (keyCode === ESCAPE) showSettingsModal = false;
    return;
  }

  if (showExitMapConfirmModal) {
    if (keyCode === ENTER) {
      showExitMapConfirmModal = false;
      exitToWorldMapRestoreEntry();
    } else if (keyCode === ESCAPE || key === 'm' || key === 'M') {
      showExitMapConfirmModal = false;
      playSFX("mapMove");
    }
    return;
  }

  if (gameState === "DEVICE_SELECT") {
    if (key === '1') {
      controlMode = "PC";
      playSFX("powerup");
      gameState = "WORLD_MAP";
    } else if (key === '2') {
      controlMode = "MOBILE";
      autoFitMobileZoom = true;
      playSFX("powerup");
      gameState = "WORLD_MAP";
    }
    return;
  }

  if (key === 'u' || key === 'U') {
    audioMuted = !audioMuted;
    return;
  }

  if (gameState === "WORLD_MAP") {
    if (worldTransition.active) return;
    if (showShopModal) {
      if (keyCode === ESCAPE) {
        mapNodesData["2-SHOP"].isOpen = false;
        showShopModal = false;
      }
      return;
    }
    if (keyCode === 80 || key === 'p' || key === 'P') {
      activateCreatorDebugMode();
      return;
    }
    if (key === 'i' || key === 'I') {
      showMapItemDrawer = !showMapItemDrawer;
      playSFX("mapMove");
      return;
    }
    if (showMapItemDrawer) {
      if (keyCode === ESCAPE || keyCode === 32 || keyCode === ENTER) {
        showMapItemDrawer = false;
      }
      return;
    }

    let curNode = mapNodesData[selectedMapNode];
    let moveDir = null;
    if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') moveDir = "right";
    else if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') moveDir = "left";
    else if (keyCode === UP_ARROW || key === 'w' || key === 'W') moveDir = "up";
    else if (keyCode === DOWN_ARROW || key === 's' || key === 'S') moveDir = "down";

    if (moveDir && curNode && curNode.neighbors) {
      let targetId = curNode.neighbors[moveDir];
      if (targetId === "TO_W1") {
        // 從 2-0 往左走回 World 1：觸發黑色聚光燈轉場
        worldTransition = {
          active: true,
          phase: "WALK_EDGE",
          dir: -1,
          timer: millis(),
          flagProgress: 1,
          roadProgress: 1,
          spotlightR: max(width, height) * 0.75
        };
        playSFX("mapMove");
      } else if (targetId === "TO_W2" && curNode.cleared) {
        // 從 1-4 往右走進 World 2：觸發黑色聚光燈轉場
        worldTransition = {
          active: true,
          phase: "WALK_EDGE",
          dir: 1,
          timer: millis(),
          flagProgress: 1,
          roadProgress: 1,
          spotlightR: max(width, height) * 0.75
        };
        playSFX("mapMove");
      } else if (targetId && mapNodesData[targetId] && mapNodesData[targetId].unlocked) {
        selectedMapNode = targetId;
        playSFX("mapMove");
      } else if (targetId) {
        playSFX("stomp");
      }
      return;
    }

    if (keyCode === ENTER || keyCode === 32) {
      enterSelectedMapNode();
    }
    return;
  }

  if (gameState === "GAME_OVER") {
    if (key === 'r' || key === 'R') {
      startLevel(currentLevel, true, false);
    } else if (key === 'm' || key === 'M') {
      exitToWorldMapRestoreEntry();
    }
    return;
  }

  if (key === 'm' || key === 'M') {
    if (gameState === "PLAYING") {
      showExitMapConfirmModal = true;
      playSFX("mapMove");
    } else if (gameState === "ALL_CLEAR") {
      exitToWorldMapRestoreEntry();
    }
    return;
  }

  if ((key === 'c' || key === 'C') && unlockedNewChar) {
    activeCharacterId = (activeCharacterId === 0) ? 1 : 0;
    playSFX("powerup");
    floatingTexts.push({
      text: activeCharacterId === 1 ? "切換角色：沙漠遊俠！" : "切換角色：原本主角！",
      x: characterX - 55,
      y: characterY - 50,
      vy: -1.4,
      life: 75,
      isOneUp: true
    });
    return;
  }

  if (key === 'r' || key === 'R') {
    startLevel(currentLevel, false, false);
    return;
  }

  if (gameState !== "PLAYING") return;

  // 點按一下 Ctrl 或 Shift 切換衝刺 / 時光領域
  if (keyCode === CONTROL || keyCode === SHIFT) {
    if (powerLevel === 3 && (powerType === "speed" || powerType === "chrono")) {
      dashToggleActive = !dashToggleActive;
      mobileDashLocked = dashToggleActive;
      if (dashToggleActive && powerType === "chrono") {
        triggerChronoShockwave();
      }
      playSFX("mapMove");
    }
    return false;
  }

  if (key === 'b' || key === 'B') {
    triggerDropReservedItem();
    return;
  }

  if (keyCode === 32 || keyCode === 87) { 
  triggerJumpAction();
  return false; 
}

  if (key === 'f' || key === 'F') { 
    triggerFireAction();
  }
  // 2-4 黑暗礦坑按 [E] 或 [T] 在腳下插一根火把
  if ((key === 'e' || key === 'E' || key === 't' || key === 'T') && currentWorld === 2 && currentLevel === 4) {
    placeTorchAtPlayer();
  }
  if ((key === 'c' || key === 'C') && unlockedNewChar) {
    activeCharacterId = (activeCharacterId === 0) ? 1 : 0;
    playSFX("powerup");
    floatingTexts.push({
      text: activeCharacterId === 1 ? "切換角色：沙漠遊俠！" : "切換角色：原本主角！",
      x: characterX - 55,
      y: characterY - 50,
      vy: -1.4,
      life: 75,
      isOneUp: true
    });
  }
} 

function keyReleased() {
  if (isEditingMobileControls || gameState === "DYING_ANIMATION") return;
  if ((keyCode === 32 || keyCode === 87) && gameState === "PLAYING") {
    if (velocityY < 0 && powerType !== "feather" && wallJumpLockTimer <= 0) {
      velocityY = 0;      
      isShortJump = true; 
    }
  }
}

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
}
