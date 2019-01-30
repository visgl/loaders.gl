const DEFAULT_COLOR = {constant: true, size: 4, value: new Float32Array([0, 0, 0, 255])};
const DEFAULT_NORMAL = {constant: true, size: 3, value: new Float32Array([0, 0, 1])};
const DEFAULT_TEX_COORDS = {constant: true, size: 2, value: new Float32Array([0, 0])};

/* eslint-disable complexity */
export function normalizeAttributes(data) {
  const {attributes, indices} = data;

  const positions = attributes.position || attributes.POSITION;
  const colors = attributes.color || attributes.COLOR || attributes.COLOR_0;
  const normals = attributes.normal || attributes.NORMAL;
  const texCoords = attributes.uv || attributes.TEXCOORD || attributes.TEXCOORD_0;

  if (!positions) {
    throw new Error('Mesh without position');
  }

  const mesh = {
    colors: DEFAULT_COLOR,
    normals: DEFAULT_NORMAL,
    texCoords: DEFAULT_TEX_COORDS
  };

  mesh.positions = arrayToType(positions, Float32Array);

  if (indices) {
    mesh.indices = arrayToType(indices, Uint32Array);
  }
  if (colors) {
    mesh.colors = {value: arrayToType(colors, Uint8ClampedArray), size: 4};
  }
  if (normals) {
    mesh.normals = {value: arrayToType(normals, Float32Array), size: 3};
  }
  if (texCoords) {
    mesh.texCoords = {value: arrayToType(texCoords, Float32Array), size: 2};
  }
  return mesh;
}

function arrayToType(array, Type) {
  array = (array && array.value) || array;
  if (!array || !array.length) {
    return null;
  }
  if (array instanceof Type) {
    return array;
  }
  return new Type(array);
}
