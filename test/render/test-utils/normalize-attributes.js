const DEFAULT_COLOR = {constant: true, size: 4, value: new Float32Array([0, 0, 0, 255])};
const DEFAULT_NORMAL = {constant: true, size: 3, value: new Float32Array([0, 0, 1])};
const DEFAULT_TEX_COORDS = {constant: true, size: 2, value: new Float32Array([0, 0])};

/* eslint-disable complexity */
export function normalizeAttributes(data) {
  const {attributes, glTFAttributeMap} = data;

  const mesh = {
    colors: DEFAULT_COLOR,
    normals: DEFAULT_NORMAL,
    texCoords: DEFAULT_TEX_COORDS
  };

  if (!glTFAttributeMap) {
    return Object.assign(mesh, attributes);
  }

  mesh.positions = attributes[glTFAttributeMap.POSITION];

  if (!mesh.positions) {
    throw new Error('Mesh without position');
  }
  if (data.indices) {
    mesh.indices = data.indices;
  }
  if ('COLOR_0' in glTFAttributeMap) {
    mesh.colors = attributes[glTFAttributeMap.COLOR_0];
  }
  if ('NORMAL' in glTFAttributeMap) {
    mesh.normals = attributes[glTFAttributeMap.NORMAL];
  }
  if ('TEXCOORD_0' in glTFAttributeMap) {
    mesh.texCoords = attributes[glTFAttributeMap.TEXCOORD_0];
  }
  return mesh;
}
