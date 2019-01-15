const DEFAULT_COLOR = {constant: true, size: 4, value: new Uint8ClampedArray([0, 0, 0, 255])};
const DEFAULT_NORMAL = {constant: true, size: 3, value: new Float32Array([0, 0, 1])};
const DEFAULT_TEX_COORDS = {constant: true, size: 2, value: new Float32Array([0, 0])};

export function convertToMesh(data) {
  const {attributes, indices} = data;

  if (!attributes.position) {
    throw new Error('Mesh without position');
  }

  const mesh = {};

  mesh.positions = arrayToType(attributes.position, Float32Array);

  if (indices) {
    mesh.indices = arrayToType(indices, Uint32Array);
  }

  mesh.colors = arrayToType(attributes.colors, Uint8ClampedArray) || DEFAULT_COLOR;
  mesh.normals = arrayToType(attributes.normals, Float32Array) || DEFAULT_NORMAL;
  mesh.texCoords = arrayToType(attributes.uvs, Float32Array) || DEFAULT_TEX_COORDS;
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
