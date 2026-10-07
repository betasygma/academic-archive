const rows = [];

// Adds a HUD line. `getValue` is called every frame and must return text.
export function addHudRow(label, getValue) {
  const container = document.getElementById("hud");

  const row = document.createElement("div");
  row.append(`${label}: `);

  const valueSpan = document.createElement("span");
  row.append(valueSpan);
  container.append(row);

  rows.push({ valueSpan, getValue });
}

export function addControlHint(text) {
  const hint = document.createElement("span");
  hint.textContent = text;
  document.getElementById("controls").append(hint);
}

export function updateHud() {
  for (const { valueSpan, getValue } of rows) {
    valueSpan.textContent = getValue();
  }
}