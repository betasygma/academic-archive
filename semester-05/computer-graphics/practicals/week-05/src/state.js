// Static configuration (not reset by the R key).
export const CONFIG = {
  // How many entries of FILTER_MODES the T key cycles through.
  // 2 = NEAREST / LINEAR (baseline). Set to 4 for Challenge G.
  filterModeCount: 2,
  imageTextureUrl: "./assets/texture.jpg",
};

function createDefaultState() {
  return {
    cube: {
      rotationX: 20,
      rotationY: 30,
      scale: [1.0, 1.0, 1.0],
      autoRotate: true,
    },

    camera: {
      position: [0.0, 1.4, 4.0],
      target: [0.0, 0.0, 0.0],
      up: [0.0, 1.0, 0.0],
    },

    light: {
      position: [2.0, 2.0, 2.0],
      color: [1.0, 1.0, 1.0],
      // Used by Challenge E (light orbit).
      orbit: { enabled: false, angle: 0, radius: 3.0, speed: 1.2, height: 2.0 },
    },

    ambientStrength: 0.18,
    shininess: 32.0,
    uvScale: 1.0,

    shadingMode: "FLAT",     // "FLAT" | "SMOOTH"
    filterIndex: 1,          // index into FILTER_MODES (1 = LINEAR)
    wrapIndex: 0,            // index into WRAP_MODES (0 = REPEAT)
    textureSource: "CHECKER", // "CHECKER" | "IMAGE"

    // Used by Challenge F (lighting component toggles).
    components: { ambient: true, diffuse: true, specular: true },

    // Used by Challenge D (non-uniform scale toggle).
    nonUniformScale: false,

    // Challenge H: glass box, light at the exact center.
    glass: { enabled: false, baseColor: [0.35, 0.7, 1.0], alpha: 0.25 },
  };
}

export const state = createDefaultState();

// Replaces every top-level field with a fresh default.
// Always read nested objects through `state.xxx` (never cache them in a
// variable across frames), otherwise you will hold stale references.
export function resetState() {
  const fresh = createDefaultState();
  for (const key of Object.keys(fresh)) {
    state[key] = fresh[key];
  }
}