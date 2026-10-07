// Held-key state (for continuous actions: movement, scaling values).
export const keys = {};

// One-shot handlers (for toggles). Fire once per physical key press.
const pressHandlers = new Map();

// Shifted variants map to their base key so keydown/keyup always match
// (otherwise releasing Shift before "=" would leave "+" stuck on).
const KEY_ALIASES = { "+": "=", "_": "-", "{": "[", "}": "]" };

function normalizeKey(key) {
  const lower = key.toLowerCase();
  return KEY_ALIASES[lower] ?? lower;
}

export function onKeyPress(key, handler) {
  pressHandlers.set(normalizeKey(key), handler);
}

export function initInput() {
  window.addEventListener("keydown", (event) => {
    // Do not hijack browser shortcuts such as Ctrl+R.
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = normalizeKey(event.key);
    keys[key] = true;

    if (key.startsWith("arrow")) event.preventDefault();

    if (!event.repeat) {
      const handler = pressHandlers.get(key);
      if (handler) handler();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[normalizeKey(event.key)] = false;
  });

  // Avoid stuck keys when the tab loses focus.
  window.addEventListener("blur", () => {
    for (const key of Object.keys(keys)) keys[key] = false;
  });
}