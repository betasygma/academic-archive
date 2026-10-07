// Each face: outward normal + 4 corners in the order
// bottom-left, bottom-right, top-right, top-left (as seen from outside).
const FACES = [
  { normal: [0, 0, 1],  corners: [[-0.5,-0.5, 0.5], [ 0.5,-0.5, 0.5], [ 0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] }, // front
  { normal: [0, 0, -1], corners: [[ 0.5,-0.5,-0.5], [-0.5,-0.5,-0.5], [-0.5, 0.5,-0.5], [ 0.5, 0.5,-0.5]] }, // back
  { normal: [-1, 0, 0], corners: [[-0.5,-0.5,-0.5], [-0.5,-0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5,-0.5]] }, // left
  { normal: [1, 0, 0],  corners: [[ 0.5,-0.5, 0.5], [ 0.5,-0.5,-0.5], [ 0.5, 0.5,-0.5], [ 0.5, 0.5, 0.5]] }, // right
  { normal: [0, 1, 0],  corners: [[-0.5, 0.5, 0.5], [ 0.5, 0.5, 0.5], [ 0.5, 0.5,-0.5], [-0.5, 0.5,-0.5]] }, // top
  { normal: [0, -1, 0], corners: [[-0.5,-0.5,-0.5], [ 0.5,-0.5,-0.5], [ 0.5,-0.5, 0.5], [-0.5,-0.5, 0.5]] }, // bottom
];

// Two triangles per face (indices into corners) and their UVs.
const TRIANGLE_CORNERS = [0, 1, 2, 0, 2, 3];
const CORNER_UVS = [[0, 0], [1, 0], [1, 1], [0, 1]];

// Smooth normals = direction from the cube center to each vertex.
// This is only valid because the cube is centered at the origin.
// It is a concept demo, not a general-purpose smooth-normal algorithm.
function createSmoothNormals(positions) {
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const length = Math.hypot(x, y, z);

    normals[i] = x / length;
    normals[i + 1] = y / length;
    normals[i + 2] = z / length;
  }

  return normals;
}

export function createCubeGeometry() {
  const positions = [];
  const flatNormals = [];
  const texCoords = [];

  for (const face of FACES) {
    for (const cornerIndex of TRIANGLE_CORNERS) {
      positions.push(...face.corners[cornerIndex]);
      flatNormals.push(...face.normal);
      texCoords.push(...CORNER_UVS[cornerIndex]);
    }
  }

  const positionArray = new Float32Array(positions);

  return {
    positions: positionArray,
    flatNormals: new Float32Array(flatNormals),
    smoothNormals: createSmoothNormals(positionArray),
    texCoords: new Float32Array(texCoords),
    vertexCount: positionArray.length / 3, // 36
  };
}