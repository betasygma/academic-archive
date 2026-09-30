import { Mat4 } from "./math3d.js";

/* ================= CONTEXT ================= */
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 tidak tersedia.");

/* ================= GEOMETRY ================= */
const cubePositions = new Float32Array([
  // Front
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
  // Back
   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
  // Left
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
  -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
  // Right
   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,
   0.5, -0.5,  0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
  // Top
  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
  // Bottom
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5
]);

const faceColors = [
  [0.0, 0.8, 1.0], // front cyan
  [0.2, 0.3, 1.0], // back blue
  [1.0, 0.5, 0.1], // left orange
  [0.2, 1.0, 0.4], // right green
  [1.0, 0.2, 0.8], // top magenta
  [1.0, 0.9, 0.1]  // bottom yellow
];

const cubeColors = new Float32Array(
  faceColors.flatMap((c) => [...c, ...c, ...c, ...c, ...c, ...c])
);

/* ================= SHADERS ================= */
const vertexShaderSource = `#version 300 es
in vec3 a_position;
in vec3 a_color;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
out vec3 v_color;
void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
  v_color = a_color;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;
void main() {
  outColor = vec4(v_color, 1.0);
}`;

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

function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error:\n" + info);
  }
  return program;
}

const program = createProgram(
  gl,
  createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
  createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
);

/* ================= BUFFERS ================= */
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getAttribLocation(program, "a_color");
const modelLocation = gl.getUniformLocation(program, "u_model");
const viewLocation = gl.getUniformLocation(program, "u_view");
const projectionLocation = gl.getUniformLocation(program, "u_projection");

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

/* ================= STATE ================= */
const degToRad = (d) => (d * Math.PI) / 180;

const cube = { rotationX: 0, rotationY: 0 };

const DEFAULT_CAMERA = [0.0, 1.5, 4.0];
const DEFAULT_TARGET = [0.0, 0.0, 0.0];

const camera = {
  position: [...DEFAULT_CAMERA],
  target: [...DEFAULT_TARGET],
  up: [0.0, 1.0, 0.0]
};

const projectionState = { mode: "perspective", fov: 60, near: 0.1, far: 100.0 };

const clipPresets = [
  { near: 0.1, far: 100 },
  { near: 1.0, far: 20 },
  { near: 2.5, far: 8 }
];
let clipPresetIndex = 0;

let depthEnabled = true;

// Challenge A: orbit
const orbit = { enabled: false, angle: 0, radius: 4, speed: 40 };

// Challenge E: multiple cubes (offset x, y, z)
const cubeOffsets = [
  [0, 0, 0],
  [-0.8, 0, -1.5],
  [0.8, 0, 1.5]
];
let multiCube = false;

const cameraSpeed = 2.0;
const targetSpeed = 2.0;
const fovSpeed = 35.0;

/* ================= INPUT ================= */
const keys = {};

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (e.key.startsWith("Arrow") || k === "pageup" || k === "pagedown") {
    e.preventDefault();
  }

  if (e.repeat) return;

  switch (k) {
    case "p":
      projectionState.mode =
        projectionState.mode === "perspective" ? "orthographic" : "perspective";
      break;
    case "n":
      nextClipPreset();
      break;
    case "d":
      depthEnabled = !depthEnabled;
      break;
    case "r":
      resetScene();
      break;
    case "o":
      toggleOrbit();
      break;
    case "c":
      multiCube = !multiCube;
      break;
    case "1":
      projectionState.fov = 35;
      break;
    case "2":
      projectionState.fov = 60;
      break;
    case "3":
      projectionState.fov = 90;
      break;
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* ================= ACTIONS ================= */
function nextClipPreset() {
  clipPresetIndex = (clipPresetIndex + 1) % clipPresets.length;
  const p = clipPresets[clipPresetIndex];
  projectionState.near = p.near;
  projectionState.far = p.far;
}

function toggleOrbit() {
  orbit.enabled = !orbit.enabled;
  if (orbit.enabled) {
    const dx = camera.position[0] - camera.target[0];
    const dz = camera.position[2] - camera.target[2];
    orbit.radius = Math.max(0.5, Math.hypot(dx, dz));
    orbit.angle = Math.atan2(dz, dx);
  }
}

function resetScene() {
  camera.position = [...DEFAULT_CAMERA];
  camera.target = [...DEFAULT_TARGET];

  projectionState.mode = "perspective";
  projectionState.fov = 60;
  clipPresetIndex = 0;
  projectionState.near = clipPresets[0].near;
  projectionState.far = clipPresets[0].far;

  depthEnabled = true;
  orbit.enabled = false;
  multiCube = false;
}

/* ================= UPDATE ================= */
function updateCube(dt) {
  cube.rotationX += 25 * dt;
  cube.rotationY += 40 * dt;
}

function updateCamera(dt) {
  // Challenge B: tinggi (berlaku di semua mode)
  if (keys["arrowup"] || keys["pageup"]) camera.position[1] += cameraSpeed * dt;
  if (keys["arrowdown"] || keys["pagedown"]) camera.position[1] -= cameraSpeed * dt;

  if (orbit.enabled) {
    // W/S ubah radius, X/Z dihitung dari sudut
    if (keys["w"]) orbit.radius = Math.max(0.5, orbit.radius - cameraSpeed * dt);
    if (keys["s"]) orbit.radius += cameraSpeed * dt;

    orbit.angle += degToRad(orbit.speed) * dt;
    camera.position[0] = camera.target[0] + Math.cos(orbit.angle) * orbit.radius;
    camera.position[2] = camera.target[2] + Math.sin(orbit.angle) * orbit.radius;
  } else {
    if (keys["arrowleft"]) camera.position[0] -= cameraSpeed * dt;
    if (keys["arrowright"]) camera.position[0] += cameraSpeed * dt;
    if (keys["w"]) camera.position[2] -= cameraSpeed * dt;
    if (keys["s"]) camera.position[2] += cameraSpeed * dt;
  }

  // Challenge C: target
  if (keys["j"]) camera.target[0] -= targetSpeed * dt;
  if (keys["l"]) camera.target[0] += targetSpeed * dt;
  if (keys["i"]) camera.target[1] += targetSpeed * dt;
  if (keys["k"]) camera.target[1] -= targetSpeed * dt;
}

function updateFOV(dt) {
  if (keys["["]) projectionState.fov -= fovSpeed * dt;
  if (keys["]"]) projectionState.fov += fovSpeed * dt;
  projectionState.fov = Math.max(30, Math.min(100, projectionState.fov));
}

/* ================= MATRICES ================= */
function createModelMatrix(offset) {
  const rx = Mat4.rotationX(degToRad(cube.rotationX));
  const ry = Mat4.rotationY(degToRad(cube.rotationY));
  const t = Mat4.translation(offset[0], offset[1], offset[2]);

  let model = Mat4.identity();
  model = Mat4.multiply(model, rx);
  model = Mat4.multiply(model, ry);
  model = Mat4.multiply(model, t); // rotate dulu, baru translate
  return model;
}

function createProjectionMatrix() {
  const aspect = canvas.width / canvas.height;

  if (projectionState.mode === "perspective") {
    return Mat4.perspective(
      degToRad(projectionState.fov),
      aspect,
      projectionState.near,
      projectionState.far
    );
  }

  const size = 2.0;
  return Mat4.orthographic(
    -size * aspect, size * aspect,
    -size, size,
    projectionState.near, projectionState.far
  );
}

/* ================= DRAW ================= */
function drawCube(model, view, projection) {
  gl.uniformMatrix4fv(modelLocation, false, model);
  gl.uniformMatrix4fv(viewLocation, false, view);
  gl.uniformMatrix4fv(projectionLocation, false, projection);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

/* ================= HUD ================= */
const $ = (id) => document.getElementById(id);
const projectionInfo = $("projectionInfo");
const cameraInfo = $("cameraInfo");
const targetInfo = $("targetInfo");
const fovInfo = $("fovInfo");
const clipInfo = $("clipInfo");
const depthInfo = $("depthInfo");
const orbitInfo = $("orbitInfo");
const cubeInfo = $("cubeInfo");

const fmt3 = (v) => `(${v[0].toFixed(2)}, ${v[1].toFixed(2)}, ${v[2].toFixed(2)})`;

function updateHUD() {
  projectionInfo.textContent = projectionState.mode;
  cameraInfo.textContent = fmt3(camera.position);
  targetInfo.textContent = fmt3(camera.target);
  fovInfo.textContent =
    projectionState.mode === "perspective"
      ? `${projectionState.fov.toFixed(1)}°`
      : `${projectionState.fov.toFixed(1)}° (tidak dipakai di ortho)`;
  clipInfo.textContent = `${projectionState.near} / ${projectionState.far}`;
  depthInfo.textContent = depthEnabled ? "ON" : "OFF";
  orbitInfo.textContent = orbit.enabled ? "ON" : "OFF";
  cubeInfo.textContent = multiCube ? "3" : "1";
}

/* ================= LOOP ================= */
let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05);

  updateCube(dt);
  updateCamera(dt);
  updateFOV(dt);

  if (depthEnabled) gl.enable(gl.DEPTH_TEST);
  else gl.disable(gl.DEPTH_TEST);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.03, 0.05, 0.10, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  const view = Mat4.lookAt(camera.position, camera.target, camera.up);
  const projection = createProjectionMatrix();

  const offsets = multiCube ? cubeOffsets : [cubeOffsets[0]];
  for (const off of offsets) {
    drawCube(createModelMatrix(off), view, projection);
  }

  updateHUD();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);