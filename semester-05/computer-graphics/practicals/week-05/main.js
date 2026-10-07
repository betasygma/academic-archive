import { state } from "./src/state.js";
import { createRenderer } from "./src/renderer.js";
import { createCheckerTexture, applyTextureParams, FILTER_MODES, WRAP_MODES } from "./src/texture.js";
import { initInput, keys, onKeyPress } from "./src/input.js";
import { addHudRow, addControlHint, updateHud } from "./src/hud.js";
import { initBaseControls } from "./src/controls.js";
import { initChallenges } from "./src/challenges.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 is not available.");
}

gl.enable(gl.DEPTH_TEST);

const renderer = createRenderer(gl, canvas);

// Texture registry. Challenge A adds an IMAGE entry; the renderer falls
// back to CHECKER when the selected source does not exist.
const textures = {
  CHECKER: createCheckerTexture(gl),
  IMAGE: null,
};

// Re-applies the current filter/wrap state to every texture that exists.
function applyTextureSettings() {
  const filter = FILTER_MODES[state.filterIndex];
  const wrap = WRAP_MODES[state.wrapIndex];

  for (const texture of Object.values(textures)) {
    if (texture) applyTextureParams(gl, texture, filter, wrap);
  }
}

// Per-frame update functions: fn(dt, time). Challenges can push their own.
const updaters = [];

function addUpdater(fn) {
  updaters.push(fn);
}

// Everything a baseline module or a challenge may need.
const ctx = {
  gl,
  canvas,
  state,
  textures,
  keys,
  onKeyPress,
  addUpdater,
  addHudRow,
  addControlHint,
  applyTextureSettings,
};

initInput();
initBaseControls(ctx);   // baseline requirements
initChallenges(ctx);     // challenges A–G (see src/challenges.js)
applyTextureSettings();

let lastTime = 0;

function frame(nowMs) {
  const now = nowMs * 0.001;
  // Clamp dt so a background tab does not cause a huge jump.
  const dt = Math.min(now - lastTime, 0.05);
  lastTime = now;

  for (const update of updaters) update(dt, now);

  const texture = textures[state.textureSource] ?? textures.CHECKER;
  renderer.draw(state, texture);
  updateHud();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);