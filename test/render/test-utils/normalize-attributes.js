const DEFAULT_COLOR = {constant: true, size: 4, value: new Float32Array([0, 0, 0, 255])};
const DEFAULT_NORMAL = {constant: true, size: 3, value: new Float32Array([0, 0, 1])};
const DEFAULT_TEX_COORDS = {constant: true, size: 2, value: new Float32Array([0, 0])};

/* eslint-disable complexity */
export function normalizeAttributes(data) {
  const mesh = {
    positions: data.attributes.POSITION,
    normals: data.attributes.NORMAL || DEFAULT_NORMAL,
    colors: data.attributes.COLOR_0 || DEFAULT_COLOR,
    texCoords: data.attributes.TEXCOORD_0 || DEFAULT_TEX_COORDS
  };

  if (data.indices) {
    mesh.indices = data.indices;
  }
  return mesh;
}
