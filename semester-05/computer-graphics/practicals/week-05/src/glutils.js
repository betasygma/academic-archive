export function createShader(gl, type, source) {
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

export function createProgram(gl, vertexShader, fragmentShader) {
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

// Builds the program and looks up every attribute/uniform location once.
export function createProgramInfo(gl, vsSource, fsSource, attribNames, uniformNames) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = createProgram(gl, vs, fs);

  const attribs = {};
  for (const name of attribNames) {
    attribs[name] = gl.getAttribLocation(program, name);
  }

  // A location can be null if the compiler optimised the uniform away.
  // gl.uniformXxx silently ignores null, so this is safe.
  const uniforms = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, attribs, uniforms };
}

export function createArrayBuffer(gl, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

// layout example: { a_position: { buffer, size: 3 }, a_uv: { buffer, size: 2 } }
// A VAO remembers the attribute setup, so switching normals = switching VAO.
export function createVao(gl, programInfo, layout) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  for (const [name, { buffer, size }] of Object.entries(layout)) {
    const location = programInfo.attribs[name];
    if (location === -1) continue;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }

  gl.bindVertexArray(null);
  return vao;
}