/** @typedef {import('./compute-vertex-normals')} types */
import {Vector3} from '@math.gl/core';
import {GL} from '../constants';
import {assert} from '../utils/assert';
import {makePrimitiveIterator} from '../iterators/primitive-iterator';
import {getPrimitiveModeType} from '../primitives/modes';
import {getPositions} from './get-attribute-from-geometry';

/** @type {types['computeVertexNormals']} */
// eslint-disable-next-line max-statements
export function computeVertexNormals({mode, indices, attributes}) {
  // Only support GL.TRIANGLES, GL.TRIANGLE_STRIP, GL.TRIANGLE_FAN
  assert(getPrimitiveModeType(mode) === GL.TRIANGLES, 'TRIANGLES required');

  const {values: positions} = getPositions({mode, indices, attributes});

  const normals = new Float32Array(positions.length);

  const vectorA = new Vector3();
  const vectorB = new Vector3();
  const vectorC = new Vector3();

  const vectorCB = new Vector3();
  const vectorAB = new Vector3();

  for (const primitive of makePrimitiveIterator({mode, indices, attributes})) {
    vectorA.fromArray(positions, primitive.i1 * 3);
    vectorB.fromArray(positions, primitive.i2 * 3 + 3);
    vectorC.fromArray(positions, primitive.i3 * 3 + 6);

    vectorCB.subVectors(vectorC, vectorB);
    vectorAB.subVectors(vectorA, vectorB);
    const normal = vectorCB.cross(vectorAB);
    normal.normalize();

    // @ts-ignore
    const {primitiveIndex} = primitive;

    normals[primitiveIndex * 9 + 0] = normal.x;
    normals[primitiveIndex * 9 + 1] = normal.y;
    normals[primitiveIndex * 9 + 2] = normal.z;

    normals[primitiveIndex * 9 + 3] = normal.x;
    normals[primitiveIndex * 9 + 4] = normal.y;
    normals[primitiveIndex * 9 + 5] = normal.z;

    normals[primitiveIndex * 9 + 6] = normal.x;
    normals[primitiveIndex * 9 + 7] = normal.y;
    normals[primitiveIndex * 9 + 8] = normal.z;
  }

  return normals;
}
