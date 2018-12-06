const DEFAULT_COLOR = {constant: true, size: 4, value: new Uint8ClampedArray([0, 0, 0, 255])};
const DEFAULT_NORMAL = {constant: true, size: 3, value: new Float32Array([0, 0, 1])};
const DEFAULT_TEX_COORDS = {constant: true, size: 2, value: new Float32Array([0, 0])};

export function convertToMesh({headers, accessors, attributes}) {
  return {
    indices: arrayToType(attributes.indices, Uint32Array),
    positions: arrayToType(attributes.vertices, Float32Array),
    colors: arrayToType(attributes.colors, Uint8ClampedArray) || DEFAULT_COLOR,
    normals: arrayToType(attributes.normals, Float32Array) || DEFAULT_NORMAL,
    texCoords: arrayToType(attributes.uvs, Float32Array) || DEFAULT_TEX_COORDS
  };
}

function arrayToType(array, Type) {
  if (!array || !array.length) {
    return null;
  }
  if (array instanceof Type) {
    return array;
  }
  return new Type(array);
}
