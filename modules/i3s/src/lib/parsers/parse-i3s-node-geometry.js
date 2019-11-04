import GL from '@luma.gl/constants';
import {Vector3, Matrix4} from 'math.gl';
import {Ellipsoid} from '@math.gl/geospatial';

const TYPE_ARRAY_MAP = {
  UInt8: Uint8Array,
  Float32: Float32Array
};

const GL_TYPE_MAP = {
  UInt8: GL.UNSIGNED_BYTE,
  Float32: GL.FLOAT
};

export function parseI3SNodeGeometry(arrayBuffer, tile = {}) {
  if (!tile.featureData) {
    return tile;
  }

  tile.attributes = {};

  const buffer = arrayBuffer;
  const featureData = tile.featureData;
  const geometryData = featureData.geometryData[0];
  const mbs = tile.mbs;
  const {
    params: {vertexAttributes}
  } = tile.featureData.geometryData[0];

  let minHeight = Infinity;
  let enuMatrix = new Matrix4();

  for (const attribute in vertexAttributes) {
    const {byteOffset, count, valueType, valuesPerElement} = vertexAttributes[attribute];
    const typedArrayType = TYPE_ARRAY_MAP[valueType];

    let value = new typedArrayType(buffer, byteOffset, count * valuesPerElement);

    if (attribute === 'position') {
      minHeight = value
        .filter((coordinate, index) => (index + 1) % 3 == 0)
        .reduce((accumulator, currentValue) => Math.min(accumulator, currentValue), Infinity);

      tile.vertexCount = count / 3;
      tile.cartographicOrigin = new Vector3(mbs[0], mbs[1], -minHeight);
      tile.cartesianOrigin = new Vector3();
      Ellipsoid.WGS84.cartographicToCartesian(tile.cartographicOrigin, tile.cartesianOrigin);
      Ellipsoid.WGS84.eastNorthUpToFixedFrame(tile.cartesianOrigin, enuMatrix);
      // cartesian
      value = offsetsToCartesians(value, tile.cartographicOrigin);
    }

    if (attribute === 'uv0') {
      flipY(value);
    }

    tile.attributes[attribute] = {
      value,
      type: GL_TYPE_MAP[valueType],
      size: valuesPerElement
    };

    if (attribute === 'color') {
      tile.attributes[attribute].normalized = true;
    }
  }

  const matrix = new Matrix4(geometryData.transformation).multiplyRight(enuMatrix);
  tile.matrix = matrix.invert();

  return tile;
}

const scratchVector = new Vector3([0, 0, 0]);

function flipY(texCoords) {
  for (let i = 0; i < texCoords.length; i+=2) {
    texCoords[i + 1] = 1 - texCoords[i + 1];
  }
}

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
