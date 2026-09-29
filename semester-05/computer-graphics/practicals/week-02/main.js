// ============================================================
// WebGL Primitive Playground — Pertemuan 2 (WebGL Fundamental)
// ============================================================

// --------------------------------------------------
// 1. Canvas & Context
// --------------------------------------------------
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    alert("WebGL2 is not available in this browser/device.");
    throw new Error("WebGL2 is not available.");
}

// --------------------------------------------------
// 2. Shader Source
// --------------------------------------------------
const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec3 a_color;
out vec3 v_color;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = 12.0;
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;

void main() {
  outColor = vec4(v_color, 1.0);
}
`;

// --------------------------------------------------
// 3. Shader / Program Helpers
// --------------------------------------------------
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error:\n" + info);
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error:\n" + info);
  }
  return program;
}

// --------------------------------------------------
// 4. Buffer & Attribute Helpers
// --------------------------------------------------
function createBuffer(gl, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  return buffer;
}

function setupAttribute(gl, buffer, location, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

// --------------------------------------------------
// 5. Compile + Link
// --------------------------------------------------
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// --------------------------------------------------
// 6. Attribute Locations
// --------------------------------------------------
const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getAttribLocation(program, "a_color");

// --------------------------------------------------
// 7. Vertex Data
// --------------------------------------------------
const basePositions = new Float32Array([
  // Triangle: vertex 0-2
  -0.75, -0.35,
  -0.15, -0.35,
  -0.45,  0.35,
  // Line: vertex 3-4
  0.05, -0.25,
  0.75,  0.35,
  // Points: vertex 5-7
  0.15,  0.55,
  0.45,  0.65,
  0.75,  0.55,
  // Challange A LINE_STRIP: vertex 8-10
  -0.85,  0.75,
  -0.55,  0.55,
  -0.25,  0.75,
  0.05,  0.55,
  // Challange B LINE_LOOP: vertex 11-15
  0.25,  -0.75,
  0.55,  -0.55,
  0.85,  -0.75,
  0.85,  -0.35,
  0.25,  -0.35
]);

// Salinan kerja — inilah yang diubah setiap frame dan di-upload ke GPU.
const positions = new Float32Array(basePositions);

const colors = new Float32Array([
  // Triangle
  1.0, 0.2, 0.2,
  0.2, 1.0, 0.3,
  0.2, 0.5, 1.0,
  // Line
  1.0, 0.8, 0.1,
  1.0, 0.3, 0.8,
  // Points
  0.2, 1.0, 1.0,
  1.0, 0.5, 0.1,
  0.8, 0.4, 1.0,
  // Challange A LINE_STRIP
  1.0, 1.0, 1.0, // white
  0.0, 0.0, 1.0, // blue
  0.0, 1.0, 0.0, // green
  1.0, 0.0, 0.0, // red
  // Challange B LINE_LOOP
  1.0, 1.0, 0.0, // yellow
  1.0, 1.0, 0.0, // yellow
  1.0, 0.0, 0.0, // red
  1.0, 0.0, 0.0, // red
  1.0, 0.0, 0.0 // red
]);

const colorSchemeAlt = new Float32Array([
  // Triangle
  0.9, 0.9, 0.2,
  0.9, 0.2, 0.9,
  0.2, 0.9, 0.9,
  // Line
  0.1, 0.1, 0.1,
  0.9, 0.9, 0.9,
  // Points
  1.0, 1.0, 1.0,
  0.5, 0.5, 0.5,
  0.0, 0.0, 0.0,
  // Challange A LINE_STRIP
  1.0, 1.0, 1.0, // white
  0.0, 0.0, 1.0, // blue
  0.0, 1.0, 0.0, // green
  1.0, 0.0, 0.0, // red
  // Challange B LINE_LOOP
  1.0, 1.0, 0.0, // yellow
  1.0, 1.0, 0.0, // yellow
  1.0, 0.0, 0.0, // red
  1.0, 0.0, 0.0, // red
  1.0, 0.0, 0.0 // red
]);

let useAltColorScheme = false;

function applyColorScheme(data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

// --------------------------------------------------
// 8. Buffer Initialization
// --------------------------------------------------
// DYNAMIC_DRAW untuk position karena diupdate tiap frame (animasi + input).
const positionBuffer = createBuffer(gl, positions, gl.DYNAMIC_DRAW);
// STATIC_DRAW untuk color karena warna tidak berubah tiap frame.
const colorBuffer = createBuffer(gl, colors, gl.STATIC_DRAW);

// --------------------------------------------------
// 9. State
// --------------------------------------------------
let offsetX = 0.0;
let direction = 1.0;
let isPaused = false;

const speed = 0.45;              // kecepatan animasi otomatis
const keyboardMoveSpeed = 0.8;   // kecepatan gerak manual (keyboard)

const keys = {}; // status tombol untuk state-based input

// --------------------------------------------------
// 10. Update
// --------------------------------------------------
function clampOffset() {
  offsetX = Math.max(-0.20, Math.min(0.35, offsetX));
}

// State-based: dibaca setiap frame selama tombol ditekan.
function handleInput(deltaTime) {
  if (keys["ArrowLeft"])  offsetX -= keyboardMoveSpeed * deltaTime;
  if (keys["ArrowRight"]) offsetX += keyboardMoveSpeed * deltaTime;
  clampOffset();
}

function updateTriangle(deltaTime) {
  offsetX += direction * speed * deltaTime;

  if (offsetX >= 0.35) { offsetX = 0.35; direction = -1.0; }
  if (offsetX <= -0.20) { offsetX = -0.20; direction = 1.0; }

  // Hanya vertex 0-2 (triangle) yang digeser; line & point tetap diam.
  for (let i = 0; i < 3; i++) {
    const xIndex = i * 2;
    positions[xIndex]     = basePositions[xIndex] + offsetX;
    positions[xIndex + 1] = basePositions[xIndex + 1];
  }
}

function uploadPositions() {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
}

// --------------------------------------------------
// 11. Input — hybrid: event-based (toggle) + state-based (movement)
// --------------------------------------------------
window.addEventListener("keydown", (event) => {
  keys[event.code] = true; // state-based: simpan status tombol

  if (event.code === "Space") { // event-based: aksi diskrit (toggle)
    event.preventDefault();
    if (!event.repeat) isPaused = !isPaused;
  }

  if (event.code === "KeyR" && !event.repeat) { // event-based: reset
    offsetX = 0.0;
    direction = 1.0;
    isPaused = false;
  }

  if (event.code === "KeyC" && !event.repeat) { // event-based: toggle color scheme
    useAltColorScheme = !useAltColorScheme;
    applyColorScheme(useAltColorScheme ? colorSchemeAlt : colors);
  }

  if (event.code === "KeyN" && !event.repeat && isPaused) { // event-based: next frame (manual step)
    updateTriangle(0.016); // update dengan deltaTime kecil (misal 16ms)
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

function mouseToNDC(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const x = (mouseX / rect.width) * 2.0 - 1.0;
  const y = 1.0 - (mouseY / rect.height) * 2.0; // Y dibalik: pixel ke bawah, NDC ke atas
  return { x, y };
}

const infoEl = document.getElementById("info");

canvas.addEventListener("mousemove", (event) => {
  const p = mouseToNDC(event);
  infoEl.textContent = `Mouse NDC: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})  |  Space: pause  R: reset  Arrow: geser triangle`;
});

canvas.addEventListener("click", (event) => {
  const p = mouseToNDC(event);
  const markerIndex = 7; // vertex terakhir di grup Points (ganti sesuai index target)
  positions[markerIndex * 2] = p.x;
  positions[markerIndex * 2 + 1] = p.y;
  uploadPositions();
});

// --------------------------------------------------
// 12. Draw
// --------------------------------------------------
function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.05, 0.08, 0.15, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  setupAttribute(gl, positionBuffer, positionLocation, 2);
  setupAttribute(gl, colorBuffer, colorLocation, 3);

  gl.drawArrays(gl.TRIANGLES, 0, 3); // triangle: vertex 0-2
  gl.drawArrays(gl.LINES, 3, 2);     // line: vertex 3-4
  gl.drawArrays(gl.POINTS, 5, 3);    // points: vertex 5-7
  gl.drawArrays(gl.LINE_STRIP, 8, 4); // line_strip: vertex 8-11
  gl.drawArrays(gl.LINE_LOOP, 12, 5); // line_loop: vertex 12-16
}

// --------------------------------------------------
// 13. Rendering Loop
// --------------------------------------------------
let previousTime = 0;

function render(currentTime) {
  const timeInSeconds = currentTime * 0.001;
  // deltaTime di-clamp maksimal 0.05s agar tidak "lompat" saat tab sempat ter-freeze.
  const deltaTime = Math.min(timeInSeconds - previousTime, 0.05);
  previousTime = timeInSeconds;

  handleInput(deltaTime);
  if (!isPaused) updateTriangle(deltaTime);

  uploadPositions();
  drawScene();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);