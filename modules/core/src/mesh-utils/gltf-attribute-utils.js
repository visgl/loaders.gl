import {getAccessorTypeFromSize, getComponentTypeFromArray} from './gltf-type-utils';

// Patters that map known names to GLTF counterparts
const POSITION = 'POSITION';
const TEXCOORD_0 = 'TEXCOORD_0';
const TEXCOORD_1 = 'TEXCOORD_1';
const TEXCOORD_2 = 'TEXCOORD_2';

const ATTRIBUTE_PATTERNS = [
  [/color/i, 'COLOR_0'],
  [/pickingColor/i, 'COLOR_1'],
  [/normal/i, 'NORMAL'],
  [/tangent/i, 'TANGENT'],
  [/texCoord1/i, TEXCOORD_0],
  [/texCoord2/i, TEXCOORD_1],
  [/texCoord3/i, TEXCOORD_2],
  [/texCoord/i, TEXCOORD_0],
  [/uv1/i, TEXCOORD_0],
  [/uv2/i, TEXCOORD_1],
  [/uv3/i, TEXCOORD_2],
  [/uv/i, TEXCOORD_0],
  [/joints/i, 'JOINTS_0'],
  [/weights/i, 'WEIGHTS_0'],
  [/pos/i, POSITION],
  [/vertex/i, POSITION],
  [/vertices/i, POSITION]
];

// Returns the indices array, if present
export function getGLTFIndices(attributes) {
  for (const name in attributes) {
    const attribute = attributes[name];
    if (isGLTFIndices(name)) {
      const indices = toTypedArray(attribute.value || attribute, Uint32Array);
      return getGLTFAccessor(indices);
    }
  }
  return null;
}

// Returns a fresh attributes object with glTF-standardized attributes names
// Attributes that cannot be identified will not be included
// Removes `indices` if present, as it should be stored separately from the attributes
export function getGLTFAccessors(attributes) {
  const accessors = {};
  for (const name in attributes) {
    const attribute = attributes[name];
    if (!isGLTFIndices(name)) {
      const glTFAccessor = getGLTFAccessor(attribute);
      accessors[name] = glTFAccessor;
    }
  }
  return accessors;
}

// Returns an object with a map from glTF-standardized attributes names to loaded attribute names
export function getGLTFAttributeMap(attributes) {
  const standardizedAttributes = {};
  for (const name in attributes) {
    const standardizedName = getGLTFAttributeName(name);
    if (standardizedName && !isGLTFIndices(name)) {
      standardizedAttributes[standardizedName] = name;
    }
  }
  return standardizedAttributes;
}

// Fix up a single accessor.
// Input: typed array or a partial accessor object
// Return: accessor object
export function getGLTFAccessor(attribute, gltfAttributeName) {
  const {buffer, size, count} = getAccessorData(attribute, gltfAttributeName);

  const glTFAccessor = {
    // TODO: Deprecate `value` in favor of bufferView?
    value: buffer,
    size,     // Decoded `type` (e.g. SCALAR)

    // glTF Accessor values
    // TODO: Instead of a bufferView index we could have an actual buffer (typed array)
    bufferView: null,
    byteOffset: 0,
    count,
    type: getAccessorTypeFromSize(size),
    componentType: getComponentTypeFromArray(buffer)
  };

  return glTFAccessor;
}

// Check if an attribute contains indices
function isGLTFIndices(name) {
  name = name.toLowerCase();
  return (
    name.indexOf('index') !== -1 || name.indexOf('indices') !== -1 || name.indexOf('element') !== -1
  );
}

// Convert an attribute name string to glTF 2.0 recommended attribute names
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry
function getGLTFAttributeName(name) {
  name = name.toLowerCase();
  for (const [regex, standardizedName] of ATTRIBUTE_PATTERNS) {
    if (regex.exec(name)) {
      return standardizedName;
    }
  }
  return null;
}

function getAccessorData(attribute, attributeName) {
  let buffer = attribute;
  let size = 1;
  let count = 0;

  if (attribute && attribute.value) {
    buffer = attribute.value;
    size = attribute.size || 1;
  }

  if (buffer) {
    if (!ArrayBuffer.isView(buffer)) {
      buffer = toTypedArray(buffer, Float32Array);
    }
    count = buffer.length / size;
  }

  return {buffer, size, count};
}

// Convert non-typed arrays to arrays of specified format
function toTypedArray(array, ArrayType, convertTypedArrays = false) {
  if (!array) {
    return null;
  }
  if (Array.isArray(array)) {
    return new ArrayType(array);
  }
  if (convertTypedArrays && !(array instanceof ArrayType)) {
    return new ArrayType(array);
  }
  return array;
}
