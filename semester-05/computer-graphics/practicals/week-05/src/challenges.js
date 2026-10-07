// All challenge code goes here. Each section below is filled in by the
// step-by-step guide (Challenge A–G). Leave this file empty until then;
// the baseline already satisfies the minimum requirements.
//
// Available in `ctx`:
//   gl, canvas, state, textures, keys, onKeyPress, addUpdater,
//   addHudRow, addControlHint, applyTextureSettings

import { Vec3 } from "../math3d.js";
import { CONFIG } from "./state.js";
import { FILTER_MODES, loadImageTexture } from "./texture.js";

export function initChallenges(ctx) {
  const {
    gl, state, textures, keys, onKeyPress,
    addUpdater, addHudRow, addControlHint, applyTextureSettings,
  } = ctx;

  // --- Challenge A: image texture ---
  // The texture exists immediately (magenta 1x1 placeholder) and is replaced
  // by the real image when it finishes loading.
  textures.IMAGE = loadImageTexture(
    gl, 
    CONFIG.imageTextureUrl, 
    applyTextureSettings // re-apply texture settings when the image is loaded
  );

  onKeyPress("x", () => {
    state.textureSource = (state.textureSource === "CHECKER") ? "IMAGE" : "CHECKER";
  });

  addHudRow("Texture", () => state.textureSource);
  addControlHint("X = Texture source");
  
  // --- Challenge B: ambient control ---
  addUpdater((dt) => {
    if (keys["a"]) state.ambientStrength += 0.5 * dt;
    if (keys["z"]) state.ambientStrength -= 0.5 * dt;
    state.ambientStrength = Math.min(1.0, Math.max(0.0, state.ambientStrength));
  })

  addHudRow("Ambient", () => state.ambientStrength.toFixed(2));
  addControlHint("A / Z = Ambient");

  // --- Challenge C: camera control ---

  // --- Challenge D: non-uniform scale toggle ---

  // --- Challenge E: light orbit ---

  // --- Challenge F: lighting components toggle ---
  const toggleComponent = (name) => {
    state.components[name] = !state.components[name];
  };

  onKeyPress("1", () => toggleComponent("ambient"));
  onKeyPress("2", () => toggleComponent("diffuse"));
  onKeyPress("3", () => toggleComponent("specular"));

  addHudRow("Components", () => {
    const c = state.components;
    const flag = (on) => (on ? "ON" : "off");
    return `Ambient ${flag(c.ambient)} | Diffuse ${flag(c.diffuse)} | Specular ${flag(c.specular)}`;
  });
  addControlHint("1/2/3 = Ambient/Diffuse/Specular");

  // --- Challenge G: mipmap filtering ---

  // --- Challenge H: glass box, light at the exact center ---
  let savedLightPosition = null;

  onKeyPress("v", () => {
    state.glass.enabled = !state.glass.enabled;

    if (state.glass.enabled) {
      savedLightPosition = [...state.light.position];
      state.light.orbit.enabled = false;
    } else if (savedLightPosition) {
      // Put the light back where it was before entering glass mode.
      savedLightPosition.forEach((value, i) => {
        state.light.position[i] = value;
      });
    }
  });

  // Pin the light to the origin every frame while glass mode is on.
  // Registered after Challenge E, so it overrides orbit and manual input.
  addUpdater(() => {
    if (!state.glass.enabled) return;
    const p = state.light.position;
    p[0] = 0; p[1] = 0; p[2] = 0;
  });

  addUpdater((dt) => {
    if (keys["b"]) state.glass.alpha += 0.5 * dt;
    if (keys["c"]) state.glass.alpha -= 0.5 * dt;
    state.glass.alpha = Math.min(1.0, Math.max(0.02, state.glass.alpha));
  });

  addHudRow("Glass box", () => (state.glass.enabled ? "ON" : "off"));
  addHudRow("Base alpha", () => state.glass.alpha.toFixed(2));
  addControlHint("V = Glass box (light at center)");
  addControlHint("B / C = Base alpha");
}