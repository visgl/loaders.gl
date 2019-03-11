import {getGLTFAttribute} from '@loaders.gl/core';

const DEFAULT_COLOR = {constant: true, size: 4, value: new Float32Array([0, 0, 0, 255])};
const DEFAULT_NORMAL = {constant: true, size: 3, value: new Float32Array([0, 0, 1])};
const DEFAULT_TEX_COORDS = {constant: true, size: 2, value: new Float32Array([0, 0])};

/* eslint-disable complexity */
export function normalizeAttributes(data) {
  if (!data.glTFAttributeMap) {
    return Object.assign(
      {
        colors: DEFAULT_COLOR,
        normals: DEFAULT_NORMAL,
        texCoords: DEFAULT_TEX_COORDS
      },
      data.attributes
    );
  }

  const mesh = {
    positions: getGLTFAttribute(data, 'POSITION'),
    colors: getGLTFAttribute(data, 'COLOR_0') || DEFAULT_COLOR,
    normals: getGLTFAttribute(data, 'NORMAL') || DEFAULT_NORMAL,
    texCoords: getGLTFAttribute(data, 'TEXCOORD_0') || DEFAULT_TEX_COORDS
  };

  if (data.indices) {
    mesh.indices = data.indices;
  }
  return mesh;
}
