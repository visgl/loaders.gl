// GLTF 1.0 extensions
export const KHR_BINARY_GLTF = 'KHR_binary_glTF';

// GLTF 2.0 extensions
export const KHR_DRACO_MESH_COMPRESSION = 'KHR_draco_mesh_compression';
export const KHR_LIGHTS_PUNCTUAL = 'KHR_lights_punctual';
export const KHR_MATERIALS_UNLIT = 'KHR_materials_unlit';
export const KHR_TECHNIQUES_WEBGL = 'KHR_techniques_webgl';

// External extensions
export const EXT_MESHOPT_COMPRESSION = 'EXT_meshopt_compression';

const COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const BYTES = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4 // FLOAT
};

// ENUM LOOKUP

export function getBytesFromComponentType(componentType) {
  return BYTES[componentType];
}

export function getSizeFromAccessorType(type) {
  return COMPONENTS[type];
}

export function getGLEnumFromSamplerParameter(parameter) {
  const GL_TEXTURE_MAG_FILTER = 0x2800;
  const GL_TEXTURE_MIN_FILTER = 0x2801;
  const GL_TEXTURE_WRAP_S = 0x2802;
  const GL_TEXTURE_WRAP_T = 0x2803;

  const PARAMETER_MAP = {
    magFilter: GL_TEXTURE_MAG_FILTER,
    minFilter: GL_TEXTURE_MIN_FILTER,
    wrapS: GL_TEXTURE_WRAP_S,
    wrapT: GL_TEXTURE_WRAP_T
  };

  return PARAMETER_MAP[parameter];
}
