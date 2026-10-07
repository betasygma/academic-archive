// Column-major math helpers (the layout WebGL expects).
// Matrices are Float32Array; vectors are plain arrays.

export function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export const Vec3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  length: (a) => Math.hypot(a[0], a[1], a[2]),
  normalize(a) {
    const len = Math.hypot(a[0], a[1], a[2]);
    return len > 1e-8 ? [a[0] / len, a[1] / len, a[2] / len] : [0, 0, 0];
  },
};

export const Mat4 = {
  identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  },

  // Returns a * b (apply b first, then a).
  multiply(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a[k * 4 + row] * b[col * 4 + k];
        }
        out[col * 4 + row] = sum;
      }
    }
    return out;
  },

  translation(x, y, z) {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ]);
  },

  scaling(x, y, z) {
    return new Float32Array([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    ]);
  },

  rotationX(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return new Float32Array([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ]);
  },

  rotationY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return new Float32Array([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ]);
  },

  rotationZ(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return new Float32Array([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  },

  // Right-handed view matrix: camera looks down its own -Z axis.
  lookAt(eye, target, up) {
    const z = Vec3.normalize(Vec3.sub(eye, target)); // backward
    const x = Vec3.normalize(Vec3.cross(up, z));     // right
    const y = Vec3.cross(z, x);                      // true up

    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -Vec3.dot(x, eye), -Vec3.dot(y, eye), -Vec3.dot(z, eye), 1,
    ]);
  },

  // Right-handed perspective, clip-space depth in [-1, 1] (WebGL convention).
  perspective(fovYRad, aspect, near, far) {
    const f = 1 / Math.tan(fovYRad / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  },
};

// Normal matrix = transpose(inverse(upper-left 3x3 of the model matrix)).
// For a matrix M with columns c0, c1, c2, the inverse has rows
// (c1×c2, c2×c0, c0×c1) / det, so its transpose has those as columns.
export function normalMatrixFromMat4(m) {
  const c0 = [m[0], m[1], m[2]];
  const c1 = [m[4], m[5], m[6]];
  const c2 = [m[8], m[9], m[10]];

  const r0 = Vec3.cross(c1, c2);
  const r1 = Vec3.cross(c2, c0);
  const r2 = Vec3.cross(c0, c1);

  const det = Vec3.dot(c0, r0);

  // Degenerate matrix (e.g. zero scale): fall back to identity.
  if (Math.abs(det) < 1e-6) {
    return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  }

  const invDet = 1 / det;
  return new Float32Array([
    r0[0] * invDet, r0[1] * invDet, r0[2] * invDet,
    r1[0] * invDet, r1[1] * invDet, r1[2] * invDet,
    r2[0] * invDet, r2[1] * invDet, r2[2] * invDet,
  ]);
}