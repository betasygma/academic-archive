import { Mat3 } from "./matrix3.js";

// ============================================================
// 1. WEBGL2 CONTEXT
// ============================================================
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

gl.viewport(0, 0, canvas.width, canvas.height);

// ============================================================
// 2. GEOMETRY (LOCAL SPACE) — dipakai ulang untuk Object A & B
// ============================================================
const vertices = new Float32Array([
  -0.18, -0.15,
   0.18, -0.15,
   0.00,  0.22
]);

// ============================================================
// 3. SHADERS
// ============================================================
const vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;

void main() {
  vec3 p = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
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

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error:\n" + info);
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// ============================================================
// 4. BUFFER & ATTRIBUTE
// ============================================================
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// ============================================================
// 5. UNIFORM LOCATIONS
// ============================================================
const matrixLocation = gl.getUniformLocation(program, "u_matrix");
const colorLocation = gl.getUniformLocation(program, "u_color");

// ============================================================
// 6. HELPER DEGREE -> RADIAN
// ============================================================
function degToRad(degree) {
  return (degree * Math.PI) / 180;
}

// ============================================================
// 7. STATE OBJECT A (kontrol manual via keyboard)
// ============================================================
const objectA = {
  x: -0.35,
  y: 0.0,
  rotation: 0.0,
  scaleX: 1.0,
  scaleY: 1.0
};

const colorA = new Float32Array([0.10, 0.75, 1.00, 1.00]);

const DEFAULT_A = { ...objectA }; // simpan state awal untuk reset

// ============================================================
// 8. MATRIX COMPOSITION (Order: Scale -> Rotate -> Translate)
// ============================================================
function createTRSMatrix(transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const r = Mat3.rotation(degToRad(transform.rotation));
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);

  let matrix = Mat3.identity();
  matrix = Mat3.multiply(matrix, s);
  matrix = Mat3.multiply(matrix, r);
  matrix = Mat3.multiply(matrix, t);
  return matrix;
}

// Order alternatif: Translate -> Rotate -> Scale (kebalikan urutan multiply)
function createAltMatrix(transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const r = Mat3.rotation(degToRad(transform.rotation));
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);

  let matrix = Mat3.identity();
  matrix = Mat3.multiply(matrix, t);
  matrix = Mat3.multiply(matrix, r);
  matrix = Mat3.multiply(matrix, s);
  return matrix;
}

let transformOrder = "TRS"; // "TRS" atau "ALT", toggle dengan tombol T

// ============================================================
// 8b. CHALLENGE E — PARENT & CHILD
// ============================================================
// Child transform bersifat LOKAL terhadap parent (Object A).
// Offset (0.3, 0) berarti "0.3 satuan di depan parent", bukan
// posisi absolut di world.
const childTransform = {
  x: 0.30,
  y: 0.0,
  rotation: 0.0,
  scaleX: 0.5,
  scaleY: 0.5
};

const colorChild = new Float32Array([0.65, 1.00, 0.40, 1.00]);

function createChildMatrix(parentMatrix, transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const r = Mat3.rotation(degToRad(transform.rotation));
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);

  // Mulai dari parentMatrix (bukan identity) -> child world = parentWorld * childLocal
  let matrix = parentMatrix;
  matrix = Mat3.multiply(matrix, s);
  matrix = Mat3.multiply(matrix, r);
  matrix = Mat3.multiply(matrix, t);
  return matrix;
}

// ============================================================
// 9. DRAW HELPER
// ============================================================
function drawObject(matrix, color) {
  gl.uniformMatrix3fv(matrixLocation, false, matrix);
  gl.uniform4fv(colorLocation, color);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ============================================================
// 10. OBJECT B — automatic animation
// ============================================================
const colorB = new Float32Array([1.00, 0.55, 0.10, 1.00]);

function createObjectBMatrix(seconds) {
  const rotation = seconds * 70.0;
  const scale = 1.0 + Math.sin(seconds * 2.0) * 0.25;

  const transformB = {
    x: 0.42,
    y: 0.0,
    rotation,
    scaleX: scale,
    scaleY: scale
  };

  return createTRSMatrix(transformB);
}

// ============================================================
// 10b. CHALLENGE F — SIMPLE ORBIT (matrix composition, bukan physics)
// ============================================================
const colorOrbit = new Float32Array([0.85, 0.40, 1.00, 1.00]);
const orbitRadius = 0.55;
const orbitSpeed = 1.2; // radian per detik

function createOrbitMatrix(seconds) {
  const s = Mat3.scaling(0.6, 0.6);
  const tRadius = Mat3.translation(orbitRadius, 0); // dorong keluar dari origin dulu
  const rOrbit = Mat3.rotation(seconds * orbitSpeed); // baru putar terhadap origin

  let matrix = Mat3.identity();
  matrix = Mat3.multiply(matrix, s);
  matrix = Mat3.multiply(matrix, tRadius);
  matrix = Mat3.multiply(matrix, rOrbit);
  return matrix;
}

// ============================================================
// 11. KEYBOARD INPUT (state-based untuk kontinu, event-based utk reset)
// ============================================================
const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }

  if (event.key.toLowerCase() === "r" && !event.repeat) {
    resetObjectA();
  }

  if (["1", "2", "3"].includes(event.key) && !event.repeat) {
    applyPreset(Number(event.key) - 1);
  }

  if (event.key.toLowerCase() === "t" && !event.repeat) {
    transformOrder = transformOrder === "TRS" ? "ALT" : "TRS";
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ============================================================
// 11c. CHALLENGE D — MOUSE TRANSLATION (klik canvas)
// ============================================================
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const pixelX = (event.clientX - rect.left) * (canvas.width / rect.width);
  const pixelY = (event.clientY - rect.top) * (canvas.height / rect.height);

  objectA.x = (pixelX / canvas.width) * 2 - 1;
  objectA.y = 1 - (pixelY / canvas.height) * 2; // flip Y: pixel Y ke bawah, NDC Y ke atas
});

function resetObjectA() {
  objectA.x = DEFAULT_A.x;
  objectA.y = DEFAULT_A.y;
  objectA.rotation = DEFAULT_A.rotation;
  objectA.scaleX = DEFAULT_A.scaleX;
  objectA.scaleY = DEFAULT_A.scaleY;
}

// ============================================================
// 11b. CHALLENGE B — TRANSFORM PRESET (key 1 / 2 / 3)
// ============================================================
const PRESETS = [
  { x: -0.4, y:  0.2, rotation: 0,  scaleX: 1.0, scaleY: 1.0 },
  { x:  0.0, y:  0.0, rotation: 45, scaleX: 1.5, scaleY: 1.5 },
  { x:  0.3, y: -0.2, rotation: 90, scaleX: 1.8, scaleY: 0.6 }
];

let activePreset = null; // untuk ditampilkan di HUD

function applyPreset(index) {
  const preset = PRESETS[index];
  if (!preset) return;

  objectA.x = preset.x;
  objectA.y = preset.y;
  objectA.rotation = preset.rotation;
  objectA.scaleX = preset.scaleX;
  objectA.scaleY = preset.scaleY;

  activePreset = index + 1; // 1-based untuk ditampilkan
}

// ============================================================
// 12. UPDATE PER-FRAME (translation, rotation, scaling, clamp)
// ============================================================
const moveSpeed = 0.65;
const rotationSpeed = 100.0;
const scaleSpeed = 0.8;

function updateTranslation(dt) {
  if (keys["arrowleft"]) objectA.x -= moveSpeed * dt;
  if (keys["arrowright"]) objectA.x += moveSpeed * dt;
  if (keys["arrowup"]) objectA.y += moveSpeed * dt;
  if (keys["arrowdown"]) objectA.y -= moveSpeed * dt;
}

function updateRotation(dt) {
  if (keys["q"]) objectA.rotation -= rotationSpeed * dt;
  if (keys["e"]) objectA.rotation += rotationSpeed * dt;
}

function updateUniformScale(dt) {
  if (keys["+"] || keys["="]) {
    objectA.scaleX += scaleSpeed * dt;
    objectA.scaleY += scaleSpeed * dt;
  }
  if (keys["-"] || keys["_"]) {
    objectA.scaleX -= scaleSpeed * dt;
    objectA.scaleY -= scaleSpeed * dt;
  }
}

function updateNonUniformScale(dt) {
  if (keys["z"]) objectA.scaleX -= scaleSpeed * dt;
  if (keys["x"]) objectA.scaleX += scaleSpeed * dt;
  if (keys["c"]) objectA.scaleY -= scaleSpeed * dt;
  if (keys["v"]) objectA.scaleY += scaleSpeed * dt;
}

function clampObjectA() {
  objectA.x = Math.max(-0.8, Math.min(0.8, objectA.x));
  objectA.y = Math.max(-0.75, Math.min(0.75, objectA.y));
  objectA.scaleX = Math.max(0.2, Math.min(2.5, objectA.scaleX));
  objectA.scaleY = Math.max(0.2, Math.min(2.5, objectA.scaleY));
}

function update(dt) {
  updateTranslation(dt);
  updateRotation(dt);
  updateUniformScale(dt);
  updateNonUniformScale(dt);
  clampObjectA();
}

// ============================================================
// 13. HUD
// ============================================================
const positionInfo = document.getElementById("positionInfo");
const rotationInfo = document.getElementById("rotationInfo");
const scaleInfo = document.getElementById("scaleInfo");
const orderInfo = document.getElementById("orderInfo");
const presetInfo = document.getElementById("presetInfo");

function updateHUD() {
  positionInfo.textContent = `(${objectA.x.toFixed(2)}, ${objectA.y.toFixed(2)})`;
  rotationInfo.textContent = `${objectA.rotation.toFixed(1)}°`;
  scaleInfo.textContent = `(${objectA.scaleX.toFixed(2)}, ${objectA.scaleY.toFixed(2)})`;
  presetInfo.textContent = activePreset ? `Preset ${activePreset}` : "—";
  orderInfo.textContent = transformOrder === "TRS"
    ? "Scale → Rotate → Translate"
    : "Translate → Rotate → Scale";
}

// ============================================================
// 14. RENDER SCENE
// ============================================================
function drawScene(seconds) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.03, 0.05, 0.10, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  const matrixA = transformOrder === "TRS"
    ? createTRSMatrix(objectA)
    : createAltMatrix(objectA);
  const matrixB = createObjectBMatrix(seconds);
  const matrixChild = createChildMatrix(matrixA, childTransform);
  const matrixOrbit = createOrbitMatrix(seconds);

  drawObject(matrixA, colorA);
  drawObject(matrixB, colorB);
  drawObject(matrixChild, colorChild);
  drawObject(matrixOrbit, colorOrbit);
}

// ============================================================
// 15. RENDER LOOP (deltaTime)
// ============================================================
let lastTime = 0;

function render(time) {
  const seconds = time * 0.001;

  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05);

  update(dt);
  updateHUD();
  drawScene(seconds);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);