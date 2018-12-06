// Patters that map known names to GLTF counterparts
const POSITION = 'POSITION';
const TEXCOORD_0 = 'TEXCOORD_0';
const TEXCOORD_1 = 'TEXCOORD_1';
const TEXCOORD_2 = 'TEXCOORD_2';

const ATTRIBUTE_PATTERNS = [
  [/pos/i, POSITION],
  [/vertex/i, POSITION],
  [/vertices/i, POSITION],
  [/pickingColor/i, 'COLOR_1'],
  [/color/i, 'COLOR_0'],
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
  [/weights/i, 'WEIGHTS_0']
];

// Returns the indices array, if present
export function getGLTFIndices(attributes) {
  for (const [name, attribute] of Object.entries(attributes)) {
    if (isGLTFIndices(name)) {
      return attribute;
    }
  }
  return null;
}

// Returns a fresh attributes object with glTF-standardized attributes names
// Attributes that cannot be identified will not be included
// Removes `indices` if present, as it should be stored separately from the attributes
export function getGLTFAttributes(attributes) {
  const standardizedAttributes = {};
  for (const [name, attribute] of Object.entries(attributes)) {
    const standardizedName = getGLTFAttributeName(name);
    if (standardizedName && !isGLTFIndices(name)) {
      standardizedAttributes[standardizedName] = attribute;
    }
  }
  return standardizedAttributes;
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
    console.error('Testing', name, standardizedName); // eslint-disable-line
    if (regex.exec(name)) {
      return standardizedName;
    }
  }
  return null;
}
