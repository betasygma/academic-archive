// Filter modes. `min` is used when the texture is minified (far away),
// `mag` when it is magnified (close up). Mipmap modes only apply to `min`.
export const FILTER_MODES = [
  { name: "NEAREST", min: "NEAREST", mag: "NEAREST" },
  { name: "LINEAR", min: "LINEAR", mag: "LINEAR" },
  { name: "NEAREST_MIPMAP_NEAREST", min: "NEAREST_MIPMAP_NEAREST", mag: "NEAREST" },
  { name: "LINEAR_MIPMAP_LINEAR", min: "LINEAR_MIPMAP_LINEAR", mag: "LINEAR" },
];

export const WRAP_MODES = ["REPEAT", "CLAMP_TO_EDGE", "MIRRORED_REPEAT"];

// Sets filtering + wrapping on one texture. Values are looked up by name
// on `gl`, e.g. gl["LINEAR_MIPMAP_LINEAR"].
export function applyTextureParams(gl, texture, filterMode, wrapName) {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filterMode.min]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filterMode.mag]);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapName]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapName]);
}

// Procedural 8x8 checkerboard. No asset, no CORS issue.
export function createCheckerTexture(gl) {
  const size = 64;
  const cells = 8;
  const cellSize = size / cells;

  const source = document.createElement("canvas");
  source.width = size;
  source.height = size;
  const ctx = source.getContext("2d");

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f8fafc" : "#0ea5e9";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D); // needed by the *_MIPMAP_* filters

  return texture;
}

// Returns a texture immediately (1x1 placeholder) and swaps in the real
// image once it has loaded, so the render loop never has to wait.
// `onLoad` is called after the upload (use it to re-apply texture params).
export function loadImageTexture(gl, url, onLoad) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
    gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 0, 255, 255]) // magenta = "not loaded yet"
  );

  const image = new Image();

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Image rows start at the top, UV v=0 is the bottom: flip on upload.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    gl.generateMipmap(gl.TEXTURE_2D);
    if (onLoad) onLoad();
  };

  image.onerror = () => {
    console.warn("Could not load image texture:", url);
  };

  image.src = url;
  return texture;
}