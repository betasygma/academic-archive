// ============================================================
// matrix3.js
// Operasi matrix 3x3 untuk transformasi 2D.
// Data disimpan dalam column-major order sehingga kompatibel
// dengan gl.uniformMatrix3fv(..., false, matrix).
// ============================================================

export const Mat3 = {
  // Identity matrix.
  identity() {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  },

  // Translation matrix.
  // Secara matematis:
  // [ 1  0 tx ]
  // [ 0  1 ty ]
  // [ 0  0  1 ]
  translation(tx, ty) {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ]);
  },

  // Rotation matrix. Sudut menggunakan radian.
  // Secara matematis:
  // [ cos -sin 0 ]
  // [ sin  cos 0 ]
  // [  0    0  1 ]
  rotation(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);

    return new Float32Array([
       c, s, 0,
      -s, c, 0,
       0, 0, 1
    ]);
  },

  // Scaling matrix.
  scaling(sx, sy) {
    return new Float32Array([
      sx, 0,  0,
      0,  sy, 0,
      0,  0,  1
    ]);
  },

  // Perkalian matrix 3x3: hasil = a x b.
  // Dengan column vector, matrix paling kanan diterapkan lebih dulu.
  multiply(a, b) {
    const out = new Float32Array(9);

    // Ubah akses array column-major menjadi notasi baris/kolom
    // agar rumus perkalian matrix mudah dibaca.
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];

    const b00 = b[0], b01 = b[3], b02 = b[6];
    const b10 = b[1], b11 = b[4], b12 = b[7];
    const b20 = b[2], b21 = b[5], b22 = b[8];

    out[0] = a00 * b00 + a01 * b10 + a02 * b20;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20;

    out[3] = a00 * b01 + a01 * b11 + a02 * b21;
    out[4] = a10 * b01 + a11 * b11 + a12 * b21;
    out[5] = a20 * b01 + a21 * b11 + a22 * b21;

    out[6] = a00 * b02 + a01 * b12 + a02 * b22;
    out[7] = a10 * b02 + a11 * b12 + a12 * b22;
    out[8] = a20 * b02 + a21 * b12 + a22 * b22;

    return out;
  }
};
