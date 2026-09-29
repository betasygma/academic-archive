import { Mat3 } from "./matrix3.js";

// ============================================================
// 1. WEBGL2 CONTEXT
// ============================================================
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2", { antialias: true });

if (!gl) {
  throw new Error("WebGL2 tidak tersedia pada browser ini.");
}

// ============================================================
// 2. SHADERS
//    Vertex lokal diubah oleh matrix 3x3 yang dikirim sebagai uniform.
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

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, "a_position");
const matrixLocation = gl.getUniformLocation(program, "u_matrix");
const colorLocation = gl.getUniformLocation(program, "u_color");

// ============================================================
// 3. SISTEM KOORDINAT SCENE + HELPER TRANSFORMASI
// ============================================================
// Scene memakai koordinat dengan origin kiri-atas:
// x = 0..ASPECT, y = 0..1.
// 1 satuan scene pada sumbu y = tinggi canvas.
// Rasio 3:2 menjaga objek lingkaran tetap bulat.
const ASPECT = canvas.width / canvas.height;

// Persen canvas (0..1) -> koordinat scene.
const pt = (xPercent, yPercent) => [xPercent * ASPECT, yPercent];

function degToRad(degree) {
  return (degree * Math.PI) / 180;
}

// A x B x C. Matrix paling kanan diterapkan lebih dahulu.
function compose(...matrices) {
  return matrices.reduce((acc, matrix) => Mat3.multiply(acc, matrix));
}

const T = (x, y) => Mat3.translation(x, y);
const R = (degree) => Mat3.rotation(degToRad(degree));
const S = (sx, sy = sx) => Mat3.scaling(sx, sy);

// Mengubah scene coordinate menjadi NDC.
const VIEW = compose(
  T(-1, 1),
  S(2 / ASPECT, -2)
);

// ============================================================
// 4. MESH / GEOMETRI LOKAL
// ============================================================
// Semua vertex dibuat satu kali. Posisi object di scene dilakukan
// melalui transformation matrix, bukan mengubah buffer setiap frame.
function createMesh(vertices, mode) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);

  return {
    vao,
    mode,
    count: vertices.length / 2
  };
}

// Lingkaran unit: pusat + titik keliling.
function circleVertices(segments) {
  const vertices = [0, 0];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push(Math.cos(angle), Math.sin(angle));
  }

  return vertices;
}

// Membuat stroke dari polyline menggunakan triangle strip.
// Ini memungkinkan garis lebih tebal daripada gl.LINES.
function strokeVertices(points, width) {
  const vertices = [];
  const half = width / 2;

  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(i - 1, 0)];
    const b = points[Math.min(i + 1, points.length - 1)];

    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const length = Math.hypot(tx, ty) || 1;

    const nx = -ty / length;
    const ny = tx / length;
    const p = points[i];

    vertices.push(
      p[0] + nx * half,
      p[1] + ny * half,
      p[0] - nx * half,
      p[1] - ny * half
    );
  }

  return vertices;
}

// Gunung memiliki puncak sedikit tumpul.
function mountainVertices(peakX) {
  return [
    -0.5, 0.5,
     0.5, 0.5,
     peakX + 0.03, -0.5,
     peakX - 0.03, -0.5
  ];
}

// Poligon dengan koordinat awal dalam persen canvas kemudian
// dipindahkan ke local space menggunakan centroid sebagai origin.
function createPolygon(pointsPercent) {
  const points = pointsPercent.map(([x, y]) => pt(x, y));
  const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;

  const local = points.flatMap(([x, y]) => [x - cx, y - cy]);

  return {
    mesh: createMesh(local, gl.TRIANGLE_FAN),
    origin: [cx, cy]
  };
}

const MESH = {
  quad: createMesh([
    -0.5, -0.5,
     0.5, -0.5,
    -0.5,  0.5,
     0.5,  0.5
  ], gl.TRIANGLE_STRIP),

  // Segitiga dengan puncak di atas.
  triangle: createMesh([
    -0.5,  0.5,
     0.5,  0.5,
     0.0, -0.5
  ], gl.TRIANGLES),

  circle: createMesh(circleVertices(64), gl.TRIANGLE_FAN),

  // Batang sedikit melebar ke bawah.
 trunk: createMesh([
  // bawah kiri
  0.42, 0.5,
  -0.42, 0.53,
  -0.24, 0.35,
  -0.2, -0.10,
  -0.2, -0.40,
  0.3, -0.40,
  0.24, -0.10,
  0.24, 0.35

  // sisi kanan naik

  // sisi kiri turun kembali

], gl.TRIANGLE_FAN),

  // Kiri: dasar 5..45%, kanan: dasar 45..95%.
  mountainLeft: createMesh(mountainVertices(0.02), gl.TRIANGLE_FAN),
  mountainRight: createMesh(mountainVertices(-0.076), gl.TRIANGLE_FAN),

  // Bentuk daun/rumput seperti V yang melengkung.
  grassV: createMesh(
    strokeVertices(
      [
        [-0.5, -0.5],
        [-0.28, 0.0],
        [-0.10, 0.38],
        [0.00, 0.50],
        [0.15, 0.40],
        [0.50, -0.30]
      ],
      0.14
    ),
    gl.TRIANGLE_STRIP
  )
};

// Sayap burung: satu lengkung dari pangkal menuju +x.
const WING_LENGTH = 0.05;
const wingPoints = [];

for (let i = 0; i <= 12; i++) {
  const s = i / 12;
  wingPoints.push([
    WING_LENGTH * s,
    -0.022 * Math.sin(Math.PI * s) + 0.01 * s * s
  ]);
}

MESH.wing = createMesh(
  strokeVertices(wingPoints, 0.006),
  gl.TRIANGLE_STRIP
);

// ============================================================
// 5. GEOMETRI KHUSUS SCENE
// ============================================================
const HORIZON = 0.4;

const APEX = pt(0.443, 0.4);
const ROAD_LEFT = pt(0.63, 1.0);
const ROAD_RIGHT = pt(0.77, 1.0);

// Jalan sebagai segitiga perspektif.
MESH.road = createMesh([
  0, 0,
  ROAD_LEFT[0] - APEX[0], ROAD_LEFT[1] - APEX[1],
  ROAD_RIGHT[0] - APEX[0], ROAD_RIGHT[1] - APEX[1]
], gl.TRIANGLES);

// Rumah: sisi kiri, atap sisi, dan tiga jendela sisi.
const HOUSE = {
  sideWall: createPolygon([
    [0.21, 0.692],
    [0.347, 0.716],
    [0.348, 0.836],
    [0.210, 0.805]
  ]),

  roofSide: createPolygon([
    [0.266, 0.553],
    [0.408, 0.562],
    [0.344, 0.716],
    [0.204, 0.690]
  ]),

  sideWindows: [
    createPolygon([
      [0.23, 0.725],
      [0.254, 0.727],
      [0.254, 0.780],
      [0.233, 0.777]
    ]),
    createPolygon([
      [0.265, 0.729],
      [0.290, 0.732],
      [0.290, 0.786],
      [0.265, 0.783]
    ]),
    createPolygon([
      [0.302, 0.733],
      [0.327, 0.737],
      [0.327, 0.792],
      [0.302, 0.788]
    ])
  ]
};

// ============================================================
// 6. WARNA
//    Nilai berikut merupakan pendekatan warna dominan pada referensi.
// ============================================================
function hex(value) {
  return new Float32Array([
    parseInt(value.slice(1, 3), 16) / 255,
    parseInt(value.slice(3, 5), 16) / 255,
    parseInt(value.slice(5, 7), 16) / 255,
    1.0
  ]);
}

const COLOR = {
  sky:      hex("#afe8fc"),
  ground:   hex("#d0eaad"),
  mountain: hex("#8c7166"),
  sun:      hex("#fee100"),
  ray:      hex("#151515"),
  road:     hex("#c8dbd0"),
  dash:     hex("#303030"),
  grass:    hex("#1e3b1e"),
  leaf:     hex("#28df20"),
  trunk:    hex("#0b5a14"),
  roof:     hex("#e4383c"),
  wall:     hex("#ffffff"),
  cream:    hex("#fff6bd"),
  bird:     hex("#111111")
};

// ============================================================
// 7. DRAW HELPER
// ============================================================
function draw(mesh, matrix, color) {
  gl.bindVertexArray(mesh.vao);
  gl.uniformMatrix3fv(matrixLocation, false, matrix);
  gl.uniform4fv(colorLocation, color);
  gl.drawArrays(mesh.mode, 0, mesh.count);
}

function drawPolygon(poly, color) {
  draw(
    poly.mesh,
    compose(VIEW, T(poly.origin[0], poly.origin[1])),
    color
  );
}

// Persegi dengan pusat dan ukuran dalam persen canvas.
function drawRect(xPercent, yPercent, wPercent, hPercent, color) {
  const [cx, cy] = pt(xPercent, yPercent);
  draw(
    MESH.quad,
    compose(
      VIEW,
      T(cx, cy),
      S(wPercent * ASPECT, hPercent)
    ),
    color
  );
}

// ============================================================
// 8. DATA OBJEK SCENE
// ============================================================

// -------------------------
// Matahari & sinar
// -------------------------
const SUN_RADIUS = 0.14;       // 14% dari tinggi canvas
const SUN_Y = HORIZON;
const SUN_START_Y = 0.70;      // tertutup lahan pada awal animasi
const SUNRISE_TIME = 1.5;

const RAY_COUNT = 14;
const RAY_INNER = SUN_RADIUS + 0.03;
const RAY_LENGTH = 0.075;
const RAY_THICKNESS = 0.006;
const RAY_SPIN_SPEED = 15;     // derajat/detik setelah matahari terbit

// -------------------------
// Burung
// -------------------------
const TRAVEL = [0.45, -0.34];
const TRAVEL_LEN = Math.hypot(TRAVEL[0], TRAVEL[1]);
const NORMAL = [
  -TRAVEL[1] / TRAVEL_LEN,
  TRAVEL[0] / TRAVEL_LEN
];

const FLY_TIME = 12;
const BACK_TIME = 5;
const CYCLE_TIME = FLY_TIME + BACK_TIME;
const BIRD_TILT = 20;
const WAVE_AMPLITUDE = 0.018;
const FLAP_AMPLITUDE = 25;
const FLAP_HZ = 2.2;

const BIRDS = [
  { end: pt(0.81, 0.10), waves: 2.0 },
  { end: pt(0.90, 0.21), waves: 1.5 }
];

// -------------------------
// Pohon
// -------------------------
const CANOPY_CENTER = pt(0.138, 0.589);
const CANOPY_CORE_RADIUS = 0.072;
const CANOPY_BLOBS = [];

for (let i = 0; i < 9; i++) {
  CANOPY_BLOBS.push({
    angle: (i / 9) * Math.PI * 2 + 0.3,
    dist: 0.062,
    radius: 0.036,
    phase: i * 1.7
  });
}

// -------------------------
// Rumput sawah: pseudo-random dengan seed tetap.
// -------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f4) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGrassField(count) {
  const rand = mulberry32(2026);
  const list = [];
  let tries = 0;

  while (list.length < count && tries < 2000) {
    tries++;

    const y = 0.45 + rand() * 0.5;
    const roadRight =
      0.443 +
      ((y - HORIZON) / (1 - HORIZON)) *
      (0.77 - 0.443);

    const minX = roadRight + 0.04;
    const maxX = 0.97;

    if (minX >= maxX) continue;

    const x = minX + rand() * (maxX - minX);

    // Dekat horizon lebih kecil; dekat kamera lebih besar.
    const depth = (y - HORIZON) / (1 - HORIZON);
    const size = 0.02 + 0.05 * depth;
    const pos = pt(x, y);

    const tooClose = list.some(
      (grass) =>
        Math.hypot(
          grass.pos[0] - pos[0],
          grass.pos[1] - pos[1]
        ) < 0.06
    );

    if (tooClose) continue;

    list.push({
      pos,
      size,
      tilt: (rand() - 0.5) * 20
    });
  }

  return list;
}

const GRASS = createGrassField(30);

// -------------------------
// Garis putus-putus jalan.
// Semakin jauh -> semakin pendek dan tipis.
// -------------------------
const ROAD_MID = [
  (ROAD_LEFT[0] + ROAD_RIGHT[0]) / 2,
  1.0
];

const ROAD_VECTOR = [
  ROAD_MID[0] - APEX[0],
  ROAD_MID[1] - APEX[1]
];

const ROAD_ANGLE =
  (Math.atan2(ROAD_VECTOR[1], ROAD_VECTOR[0]) * 180) /
  Math.PI;

const ROAD_LENGTH = Math.hypot(
  ROAD_VECTOR[0],
  ROAD_VECTOR[1]
);

const DASHES = [];

for (let k = 0; ; k++) {
  const t0 = 0.08 * Math.pow(1.32, k);
  const tNext = 0.08 * Math.pow(1.32, k + 1);

  if (t0 > 0.97) break;

  const t1 = t0 + (tNext - t0) * 0.5;
  const tm = (t0 + t1) / 2;

  DASHES.push({
    pos: [
      APEX[0] + ROAD_VECTOR[0] * tm,
      APEX[1] + ROAD_VECTOR[1] * tm
    ],
    length: (t1 - t0) * ROAD_LENGTH,
    thickness: 0.014 * tm
  });
}

// ============================================================
// 9. FUNGSI ANIMASI
// ============================================================
function easeOutCubic(p) {
  return 1 - Math.pow(1 - p, 3);
}

function smoothstep(p) {
  return p * p * (3 - 2 * p);
}

// Matahari naik selama 1.5 detik, lalu tetap di horizon.
function sunCenterY(t) {
  const progress = Math.min(t / SUNRISE_TIME, 1);
  return (
    SUN_START_Y +
    (SUN_Y - SUN_START_Y) *
    easeOutCubic(progress)
  );
}

// Matahari parent -> sinar sebagai child.
function drawSun(t) {
  const sunWorld = compose(
    VIEW,
    T(APEX[0], sunCenterY(t))
  );

  // Sinar tidak berputar selama sunrise.
  const spin =
    Math.max(0, t - SUNRISE_TIME) *
    RAY_SPIN_SPEED;

  for (let i = 0; i < RAY_COUNT; i++) {
    // Pulse besar-kecil untuk sinar.
    const pulse =
      1 +
      0.25 *
      Math.sin(t * 3 + i * 0.9);

    const length = RAY_LENGTH * pulse;
    const radialCenter = RAY_INNER + length / 2;
    const angle =
      spin +
      (i * 360) / RAY_COUNT;

    draw(
      MESH.quad,
      compose(
        sunWorld,
        R(angle),
        T(radialCenter, 0),
        S(length, RAY_THICKNESS)
      ),
      COLOR.ray
    );
  }

  // Matahari digambar di atas sinar.
  draw(
    MESH.circle,
    compose(
      sunWorld,
      S(SUN_RADIUS)
    ),
    COLOR.sun
  );
}

// Burung: badan sebagai parent, dua sayap sebagai child.
function drawBird(bird, t) {
  const localTime = t % CYCLE_TIME;

  let progress;
  let direction;

  if (localTime < FLY_TIME) {
    progress = localTime / FLY_TIME;
    direction = 1;
  } else {
    const q = (localTime - FLY_TIME) / BACK_TIME;
    progress = 1 - smoothstep(q);
    direction = -1;
  }

  // Jalur utama lurus + gelombang kecil.
  const phase =
    2 * Math.PI * bird.waves * progress;

  const wave =
    WAVE_AMPLITUDE * Math.sin(phase);

  const waveSlope =
    WAVE_AMPLITUDE *
    2 * Math.PI *
    bird.waves *
    Math.cos(phase);

  const startX = bird.end[0] - TRAVEL[0];
  const startY = bird.end[1] - TRAVEL[1];

  const x =
    startX +
    TRAVEL[0] * progress +
    NORMAL[0] * wave;

  const y =
    startY +
    TRAVEL[1] * progress +
    NORMAL[1] * wave;

  // Tilt mengikuti arah lintasan + sedikit perubahan akibat gelombang.
  const wobble =
    (Math.atan2(waveSlope, TRAVEL_LEN) * 180) /
    Math.PI;

  const tilt =
    direction *
    (BIRD_TILT + wobble);

  const body = compose(
    VIEW,
    T(x, y),
    R(tilt),
    S(direction, 1)
  );

  // Kepakan dua sayap secara berlawanan.
  const flap =
    FLAP_AMPLITUDE *
    Math.sin(2 * Math.PI * FLAP_HZ * t);

  draw(
    MESH.wing,
    compose(body, R(flap)),
    COLOR.bird
  );

  draw(
    MESH.wing,
    compose(body, R(-flap), S(-1, 1)),
    COLOR.bird
  );

  // Kaki lurus kecil.
  draw(
    MESH.quad,
    compose(
      body,
      T(0, 0),
      R(0),
      S(0.04, 0.005)
    ),
    COLOR.bird
  );
}

// Daun dibuat dari beberapa gumpalan lingkaran.
// Batang tetap diam, masing-masing gumpalan memiliki fase berbeda.
function drawTree(t) {
  const canopyWorld = compose(
    VIEW,
    T(CANOPY_CENTER[0], CANOPY_CENTER[1])
  );

  // Inti kanopi menutup celah antargumpalan.
  draw(
    MESH.circle,
    compose(
      canopyWorld,
      S(CANOPY_CORE_RADIUS)
    ),
    COLOR.leaf
  );

  for (const blob of CANOPY_BLOBS) {
    const offsetX =
      Math.cos(t * 1.7 + blob.phase) * 0.008;

    const offsetY =
      Math.sin(t * 2.1 + blob.phase * 1.3) * 0.008;

    const breath =
      1 +
      0.1 *
      Math.sin(t * 2.3 + blob.phase);

    const bx =
      Math.cos(blob.angle) * blob.dist +
      offsetX;

    const by =
      Math.sin(blob.angle) * blob.dist +
      offsetY;

    draw(
      MESH.circle,
      compose(
        canopyWorld,
        T(bx, by),
        S(blob.radius * breath)
      ),
      COLOR.leaf
    );
  }

  // Batang digambar di depan daun, sesuai referensi.
  const [tx, ty] = pt(0.13, 0.72);

  draw(
    MESH.trunk,
    compose(
      VIEW,
      T(tx, ty),
      S(0.056, 0.22)
    ),
    COLOR.trunk
  );
}

// Rumah bersifat statis.
function drawHouse() {
  // Dinding samping lebih dahulu.
  drawPolygon(HOUSE.sideWall, COLOR.wall);

  // Dinding depan.
  drawRect(
    0.405,
    0.776,
    0.112,
    0.12,
    COLOR.wall
  );

  // Atap samping lalu atap depan.
  drawPolygon(HOUSE.roofSide, COLOR.roof);

  const [rx, ry] = pt(0.41, 0.6395);

  draw(
    MESH.triangle,
    compose(
      VIEW,
      T(rx, ry),
      S(0.13 * ASPECT, 0.155)
    ),
    COLOR.roof
  );

  // Tiga jendela di dinding samping.
  for (const windowShape of HOUSE.sideWindows) {
    drawPolygon(windowShape, COLOR.cream);
  }

  // Jendela depan di kiri, pintu di kanan, mengikuti referensi.
  drawRect(
    0.3815,
    0.777,
    0.033,
    0.07,
    COLOR.cream
  );

  drawRect(
    0.4275,
    0.7885,
    0.031,
    0.093,
    COLOR.cream
  );
}

// ============================================================
// 10. RESIZE CANVAS
// ============================================================
// CSS mempertahankan rasio 3:2. Drawing buffer mengikuti ukuran
// tampilan + devicePixelRatio agar hasil tetap tajam.
function resizeCanvasToDisplaySize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
}

// ============================================================
// 11. RENDER SCENE
// ============================================================
function drawScene(t) {
  resizeCanvasToDisplaySize();

  gl.clearColor(
    COLOR.sky[0],
    COLOR.sky[1],
    COLOR.sky[2],
    1.0
  );
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  // ----------------------------------------------------------
  // Layer belakang -> depan:
  // langit -> matahari/sinar -> burung -> gunung -> lahan
  // -> jalan -> rumput -> pohon -> rumah
  // ----------------------------------------------------------

  drawSun(t);

  for (const bird of BIRDS) {
    drawBird(bird, t);
  }

  // Gunung kiri.
  draw(
    MESH.mountainLeft,
    compose(
      VIEW,
      T(0.2495 * ASPECT, 0.2925),
      S(0.387 * ASPECT, 0.215)
    ),
    COLOR.mountain
  );

  // Gunung kanan.
  draw(
    MESH.mountainRight,
    compose(
      VIEW,
      T(0.692 * ASPECT, 0.285),
      S(0.498 * ASPECT, 0.23)
    ),
    COLOR.mountain
  );

  // Lahan hijau menyatu dari horizon sampai bawah canvas.
  draw(
    MESH.quad,
    compose(
      VIEW,
      T(ASPECT / 2, (1 + HORIZON) / 2),
      S(ASPECT, 1 - HORIZON)
    ),
    COLOR.ground
  );

  // Jalan perspektif.
  draw(
    MESH.road,
    compose(VIEW, T(APEX[0], APEX[1])),
    COLOR.road
  );

  // Garis putus-putus jalan.
  for (const dash of DASHES) {
    draw(
      MESH.quad,
      compose(
        VIEW,
        T(dash.pos[0], dash.pos[1]),
        R(ROAD_ANGLE),
        S(dash.length, dash.thickness)
      ),
      COLOR.dash
    );
  }

  // Rumput di area sawah kanan.
  for (const grass of GRASS) {
    draw(
      MESH.grassV,
      compose(
        VIEW,
        T(grass.pos[0], grass.pos[1]),
        R(grass.tilt),
        S(grass.size)
      ),
      COLOR.grass
    );
  }

  // Pohon dan rumah berada di atas lahan.
  drawTree(t);
  drawHouse();
}

// ============================================================
// 12. INTERAKSI: KLIK = ULANGI ANIMASI DARI AWAL
// ============================================================
let startTime = performance.now();

canvas.addEventListener("click", () => {
  startTime = performance.now();
});

// ============================================================
// 13. RENDER LOOP
// ============================================================
function render(now) {
  const seconds = (now - startTime) / 1000;
  drawScene(Math.max(seconds, 0));
  requestAnimationFrame(render);
}

window.addEventListener("resize", () => {
  resizeCanvasToDisplaySize();
});

requestAnimationFrame(render);
