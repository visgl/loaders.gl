import GL from '@luma.gl/constants';
import {Vector3, Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

const TYPE_ARRAY_MAP = {
  UInt8: Uint8Array,
  Float32: Float32Array
};

const GL_TYPE_MAP = {
  UInt8: GL.UNSIGNED_BYTE,
  Float32: GL.FLOAT
};

const scratchVector = new Vector3([0, 0, 0]);

/* eslint-disable max-statements */
export function parseI3SNodeGeometry(arrayBuffer, tile = {}) {
  if (!tile._content) {
    return tile;
  }

  const content = tile._content;
  const mbs = tile._mbs;

  const {featureData} = content;
  content.attributes = {};

  const buffer = arrayBuffer;
  const geometryData = featureData.geometryData[0];
  const {
    params: {vertexAttributes}
  } = featureData.geometryData[0];

  let minHeight = Infinity;
  const enuMatrix = new Matrix4();

  for (const attribute in vertexAttributes) {
    const {byteOffset, count, valueType, valuesPerElement} = vertexAttributes[attribute];
    const TypedArrayType = TYPE_ARRAY_MAP[valueType];

    let value = new TypedArrayType(buffer, byteOffset, count * valuesPerElement);

    if (attribute === 'position') {
      minHeight = value
        .filter((coordinate, index) => (index + 1) % 3 === 0)
        .reduce((accumulator, currentValue) => Math.min(accumulator, currentValue), Infinity);

      content.vertexCount = count / 3;
      content.cartographicOrigin = new Vector3(mbs[0], mbs[1], -minHeight);
      content.cartesianOrigin = new Vector3();
      Ellipsoid.WGS84.cartographicToCartesian(content.cartographicOrigin, content.cartesianOrigin);
      Ellipsoid.WGS84.eastNorthUpToFixedFrame(content.cartesianOrigin, enuMatrix);
      // cartesian
      value = offsetsToCartesians(value, content.cartographicOrigin);
    }

    content.attributes[attribute] = {
      value,
      type: GL_TYPE_MAP[valueType],
      size: valuesPerElement
    };

    if (attribute === 'color') {
      content.attributes[attribute].normalized = true;
    }
  }

  const matrix = new Matrix4(geometryData.transformation).multiplyRight(enuMatrix);
  content.matrix = matrix.invert();

  content.byteLength = arrayBuffer.byteLength;
  return tile;
}
/* eslint-enable max-statements */

function offsetsToCartesians(vertices, cartographicOrigin) {
  const positions = new Float64Array(vertices.length);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = vertices[i] + cartographicOrigin.x;
    positions[i + 1] = vertices[i + 1] + cartographicOrigin.y;
    positions[i + 2] = vertices[i + 2] + cartographicOrigin.z;
  }

  for (let i = 0; i < positions.length; i += 3) {
    Ellipsoid.WGS84.cartographicToCartesian(positions.subarray(i, i + 3), scratchVector);
    positions[i] = scratchVector.x;
    positions[i + 1] = scratchVector.y;
    positions[i + 2] = scratchVector.z;
  }

  return positions;
}
