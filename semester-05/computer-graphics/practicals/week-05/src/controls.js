import { resetState } from "./state.js";
import { CONFIG } from "./state.js";
import { FILTER_MODES, WRAP_MODES } from "./texture.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Baseline requirements: light control, toggles, UV scale, shininess, HUD.
export function initBaseControls(ctx) {
  const {
    state, keys, onKeyPress, addUpdater,
    addHudRow, addControlHint, applyTextureSettings,
  } = ctx;

  // ---- Continuous (state-based) updates ----

  addUpdater(function updateCube(dt) {
    if (!state.cube.autoRotate) return;
    state.cube.rotationX += 20 * dt;
    state.cube.rotationY += 35 * dt;
  });

  const lightSpeed = 2.0;
  addUpdater(function updateLight(dt) {
    const p = state.light.position;
    if (keys["arrowleft"])  p[0] -= lightSpeed * dt;
    if (keys["arrowright"]) p[0] += lightSpeed * dt;
    if (keys["arrowup"])    p[1] += lightSpeed * dt;
    if (keys["arrowdown"])  p[1] -= lightSpeed * dt;
    if (keys["w"])          p[2] -= lightSpeed * dt;
    if (keys["s"])          p[2] += lightSpeed * dt;
  });

  addUpdater(function updateUVScale(dt) {
    if (keys["["]) state.uvScale -= 1.5 * dt;
    if (keys["]"]) state.uvScale += 1.5 * dt;
    state.uvScale = clamp(state.uvScale, 0.25, 5.0);
  });

  addUpdater(function updateShininess(dt) {
    if (keys["-"]) state.shininess -= 50 * dt;
    if (keys["="]) state.shininess += 50 * dt;
    state.shininess = clamp(state.shininess, 2.0, 128.0);
  });

  // ---- One-shot (event-based) toggles ----

  onKeyPress("f", () => {
    state.shadingMode = state.shadingMode === "FLAT" ? "SMOOTH" : "FLAT";
  });

  onKeyPress("t", () => {
    state.filterIndex = (state.filterIndex + 1) % CONFIG.filterModeCount;
    applyTextureSettings();
  });

  onKeyPress("g", () => {
    state.wrapIndex = (state.wrapIndex + 1) % WRAP_MODES.length;
    applyTextureSettings();
  });

  onKeyPress("r", () => {
    resetState();
    applyTextureSettings();
  });

  // ---- HUD ----

  addHudRow("Shading", () => state.shadingMode);
  addHudRow("Filtering", () => FILTER_MODES[state.filterIndex].name);
  addHudRow("Wrapping", () => WRAP_MODES[state.wrapIndex]);
  addHudRow("UV Scale", () => state.uvScale.toFixed(2));
  addHudRow("Shininess", () => state.shininess.toFixed(1));
  addHudRow("Light", () => {
    const [x, y, z] = state.light.position;
    return `(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`;
  });

  addControlHint("Arrow = Light X/Y");
  addControlHint("W/S = Light Z");
  addControlHint("F = Flat/Smooth");
  addControlHint("T = Filtering");
  addControlHint("G = Wrapping");
  addControlHint("[ / ] = UV Scale");
  addControlHint("- / + = Shininess");
  addControlHint("R = Reset");
}