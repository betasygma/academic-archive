import { Mat4, degToRad, normalMatrixFromMat4 } from "../math3d.js";
import { createProgramInfo, createArrayBuffer, createVao } from "./glutils.js";
import { ATTRIBUTES, UNIFORMS, vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { createCubeGeometry } from "./geometry.js";

// Model = Scale * RotX * RotY (scale is applied first, in local space).
// Because scale is the outermost-left factor, non-uniform scale distorts
// normals; this is exactly why the normal matrix is needed.
function createModelMatrix(cube) {
  const s = Mat4.scaling(cube.scale[0], cube.scale[1], cube.scale[2]);
  const rx = Mat4.rotationX(degToRad(cube.rotationX));
  const ry = Mat4.rotationY(degToRad(cube.rotationY));

  return Mat4.multiply(Mat4.multiply(s, rx), ry);
}

export function createRenderer(gl, canvas) {
  const programInfo = createProgramInfo(
    gl, vertexShaderSource, fragmentShaderSource, ATTRIBUTES, UNIFORMS
  );
  const u = programInfo.uniforms;

  const geometry = createCubeGeometry();

  const positionBuffer = createArrayBuffer(gl, geometry.positions);
  const uvBuffer = createArrayBuffer(gl, geometry.texCoords);
  const flatNormalBuffer = createArrayBuffer(gl, geometry.flatNormals);
  const smoothNormalBuffer = createArrayBuffer(gl, geometry.smoothNormals);

  // Same position/UV buffers, different normal buffer per shading mode.
  const vaos = {
    FLAT: createVao(gl, programInfo, {
      a_position: { buffer: positionBuffer, size: 3 },
      a_normal: { buffer: flatNormalBuffer, size: 3 },
      a_texCoord: { buffer: uvBuffer, size: 2 },
    }),
    SMOOTH: createVao(gl, programInfo, {
      a_position: { buffer: positionBuffer, size: 3 },
      a_normal: { buffer: smoothNormalBuffer, size: 3 },
      a_texCoord: { buffer: uvBuffer, size: 2 },
    }),
  };

  function draw(state, texture) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.025, 0.04, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.bindVertexArray(vaos[state.shadingMode]);

    const model = createModelMatrix(state.cube);
    const view = Mat4.lookAt(state.camera.position, state.camera.target, state.camera.up);
    const projection = Mat4.perspective(
      degToRad(60), canvas.width / canvas.height, 0.1, 100.0
    );

    gl.uniformMatrix4fv(u.u_model, false, model);
    gl.uniformMatrix4fv(u.u_view, false, view);
    gl.uniformMatrix4fv(u.u_projection, false, projection);
    gl.uniformMatrix3fv(u.u_normalMatrix, false, normalMatrixFromMat4(model));

    gl.uniform3fv(u.u_lightPosition, state.light.position);
    gl.uniform3fv(u.u_lightColor, state.light.color);
    gl.uniform3fv(u.u_cameraPosition, state.camera.position);

    gl.uniform1f(u.u_ambientStrength, state.ambientStrength);
    gl.uniform1f(u.u_shininess, state.shininess);
    gl.uniform1f(u.u_uvScale, state.uvScale);

    gl.uniform1f(u.u_useAmbient, state.components.ambient ? 1.0 : 0.0);
    gl.uniform1f(u.u_useDiffuse, state.components.diffuse ? 1.0 : 0.0);
    gl.uniform1f(u.u_useSpecular, state.components.specular ? 1.0 : 0.0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u.u_texture, 0);

    // Challenge H uniforms (harmless when glass mode is off).
    gl.uniform1f(u.u_useTexture, state.glass.enabled ? 0.0 : 1.0);
    gl.uniform4f(
      u.u_baseColor,
      state.glass.baseColor[0],
      state.glass.baseColor[1],
      state.glass.baseColor[2],
      state.glass.alpha
    );

    if (state.glass.enabled) {
      gl.enable(gl.BLEND);
      // Separate alpha blending keeps the canvas itself opaque.
      gl.blendFuncSeparate(
        gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE, gl.ONE_MINUS_SRC_ALPHA
      );
      gl.depthMask(false); // transparent surfaces must not hide each other
      gl.enable(gl.CULL_FACE);

      // Pass 1: inner walls (back faces) first...
      gl.cullFace(gl.FRONT);
      gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexCount);

      // Pass 2: ...then outer walls (front faces) blended on top.
      gl.cullFace(gl.BACK);
      gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexCount);

      // Restore defaults (depthMask must be true before the next clear).
      gl.disable(gl.CULL_FACE);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexCount);
    }
  }

  return { draw };
}