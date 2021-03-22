import Geometry from '@luma.gl/engine/src/geometry/geometry';
import {uid} from '@luma.gl/webgl';

// prettier-ignore
const CUBE_INDICES = new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13,
  14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
]);

// prettier-ignore
const CUBE_POSITIONS = new Float32Array([
  -1,  -1,  1, 1,  -1,  1,  1,  1,  1,  -1,  1,  1,
  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1,  -1,
  -1,  1,  -1,  -1,  1,  1,  1,  1,  1,  1,  1,  -1,
  -1,  -1,  -1,  1,  -1,  -1,  1,  -1,  1,  -1,  -1,  1,
  1,  -1,  -1,  1,  1,  -1,  1,  1,  1,  1,  -1,  1,
  -1,  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1
]);

// TODO - could be Uint8
// prettier-ignore
const CUBE_NORMALS = new Float32Array([
  // Front face
  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
  // Back face
  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,
  // Top face
  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
  // Bottom face
  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,
  // Right face
  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
  // Left face
  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0
]);

// prettier-ignore
const CUBE_TEX_COORDS = new Float32Array([
  // Front face
  0,  0,  1,  0,  1,  1,  0,  1,
  // Back face
  1,  0,  1,  1,  0,  1,  0,  0,
  // Top face
  0,  1,  0,  0,  1,  0,  1,  1,
  // Bottom face
  1,  1,  0,  1,  0,  0,  1,  0,
  // Right face
  1,  0,  1,  1,  0,  1,  0,  0,
  // Left face
  0,  0,  1,  0,  1,  1,  0,  1
]);

export default class CubeGeometry extends Geometry {
  constructor(props = {}) {
    const {id = uid('cube-geometry')} = props;
    const {indices, attributes} = tesselateCude(props);
    super({
      ...props,
      id,
      indices,
      attributes: {...attributes, ...props.attributes}
    });
  }
}

function tesselateCude(props) {
  const numVertices = 24;
  const {halfSize} = props;
  const colors = new Float32Array(numVertices * 4);
  const positions = new Float32Array(CUBE_POSITIONS);
  const normals = new Float32Array(CUBE_NORMALS);
  for (let i = 0; i < numVertices * 4; i += 4) {
    colors.set([1, 1, 1, 1], i);
  }
  for (let i = 0; i < numVertices * 3; i += 3) {
    positions[i] = positions[i] * halfSize[0] * 2;
    positions[i + 1] = positions[i + 1] * halfSize[1] * 2;
    positions[i + 2] = positions[i + 2] * halfSize[2] * 2;
  }
  return {
    indices: {size: 1, value: new Uint16Array(CUBE_INDICES)},
    attributes: {
      positions: {size: 3, value: positions},
      normals: {size: 3, value: normals},
      texCoords: {size: 2, value: new Float32Array(CUBE_TEX_COORDS)},
      colors: {size: 4, value: colors, normalized: true}
    }
  };
}
