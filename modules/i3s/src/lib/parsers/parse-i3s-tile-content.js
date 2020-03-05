/* global fetch */

import {Vector3, Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';

import {
  GL_TYPE_MAP,
  TYPE_ARRAY_MAP,
  SIZEOF,
  I3S_NAMED_HEADER_ATTRIBUTES,
  I3S_NAMED_VERTEX_ATTRIBUTES,
  I3S_NAMED_GEOMETREY_ATTRIBUTES
} from './constants';

const scratchVector = new Vector3([0, 0, 0]);

export async function parseI3STileContent(arrayBuffer, tile, tileset) {
  tile.content = tile.content || {};

  // construct featureData from defaultGeometrySchema;
  tile.content.featureData = constructFeatureDataStruct(tile, tileset);
  tile.content.attributes = {};

  const geometryBuffer = await fetch(tile.contentUrl).then(resp => resp.arrayBuffer());
  if (tile.textureUrl) {
    tile.content.texture = await load(tile.textureUrl, ImageLoader);
  }

  return parseI3SNodeGeometry(geometryBuffer, tile, tileset);
}

/* eslint-disable max-statements */
function parseI3SNodeGeometry(arrayBuffer, tile = {}) {
  if (!tile.content) {
    return tile;
  }

  const content = tile.content;
  const vertexAttributes = content.featureData.vertexAttributes;
  // First 8 bytes reserved for header (vertexCount and featurecount)
  const {vertexCount, byteOffset} = parseHeaders(content, arrayBuffer);
  const {attributes} = normalizeAttributes(arrayBuffer, byteOffset, vertexAttributes, vertexCount);

  const {enuMatrix, cartographicOrigin, cartesianOrigin} = parsePositions(
    attributes.position,
    tile
  );

  const matrix = new Matrix4(1, 0, 0, 0, 1, 0, 0, 0, 1).multiplyRight(enuMatrix);

  content.attributes = {
    positions: attributes.position,
    normals: attributes.normal,
    colors: attributes.color,
    texCoords: attributes.uv0
  };

  content.vertexCount = vertexCount;
  content.cartographicCenter = cartographicOrigin;
  content.cartesianOrigin = cartesianOrigin;
  content.modelMatrix = matrix.invert();
  content.byteLength = arrayBuffer.byteLength;

  return tile;
}

function constructFeatureDataStruct(tile, tileset) {
  // seed featureData from defaultGeometrySchema
  const defaultGeometrySchema = tileset.store.defaultGeometrySchema;
  const featureData = defaultGeometrySchema;
  // populate the vertex attributes value types and values per element
  for (const geometryAttribute in I3S_NAMED_GEOMETREY_ATTRIBUTES) {
    for (const namedAttribute in I3S_NAMED_VERTEX_ATTRIBUTES) {
      // const geomAttribute = defaultGeometrySchema[geometryAttribute];
      const attribute = defaultGeometrySchema[geometryAttribute][namedAttribute];
      if (attribute) {
        const {byteOffset = 0, count = 0, valueType, valuesPerElement} = attribute;

        featureData[geometryAttribute][namedAttribute] = {
          valueType,
          valuesPerElement,
          byteOffset,
          count
        };
      }
    }
  }

  return featureData;
}

function parseHeaders(content, buffer) {
  let byteOffset = 0;
  // First 8 bytes reserved for header (vertexCount and featurecount)
  let vertexCount = 0;
  let featureCount = 0;
  const headers = content.featureData[I3S_NAMED_HEADER_ATTRIBUTES.header];
  for (const header in headers) {
    const {property, type} = headers[header];
    const TypedArrayTypeHeader = TYPE_ARRAY_MAP[type];
    if (property === I3S_NAMED_HEADER_ATTRIBUTES.vertexCount) {
      vertexCount = new TypedArrayTypeHeader(buffer, 0, 4)[0];
      byteOffset += SIZEOF[type];
    }
    if (property === I3S_NAMED_HEADER_ATTRIBUTES.featureCount) {
      featureCount = new TypedArrayTypeHeader(buffer, 4, 4)[0];
      byteOffset += SIZEOF[type];
    }
  }
  return {
    vertexCount,
    featureCount,
    byteOffset
  };
}

/* eslint-enable max-statements */

function normalizeAttributes(buffer, byteOffset, vertexAttributes, vertexCount) {
  const attributes = {};

  for (const attribute in vertexAttributes) {
    const {valueType, valuesPerElement} = vertexAttributes[attribute];
    // update count and byteOffset count by calculating from defaultGeometrySchema + binnary content
    const count = vertexCount;
    const TypedArrayType = TYPE_ARRAY_MAP[valueType];

    const value = new TypedArrayType(buffer, byteOffset, count * valuesPerElement);

    attributes[attribute] = {
      value,
      type: GL_TYPE_MAP[valueType],
      size: valuesPerElement
    };

    if (attribute === 'color') {
      attributes.color.normalized = true;
    }
    if (attribute === 'region' || attribute === 'normal') {
      // do nothing for now...
    }

    byteOffset = byteOffset + count * valuesPerElement * SIZEOF[valueType];
  }

  return {attributes, byteOffset};
}

function parsePositions(attribute, tile) {
  const mbs = tile.mbs;
  const value = attribute.value;

  // const minHeight = value
  //   .filter((coordinate, index) => (index + 1) % 3 === 0)
  //   .reduce((accumulator, currentValue) => Math.min(accumulator, currentValue), Infinity);

  const enuMatrix = new Matrix4();
  const cartographicOrigin = new Vector3(mbs[0], mbs[1], mbs[2]);
  const cartesianOrigin = new Vector3();
  Ellipsoid.WGS84.cartographicToCartesian(cartographicOrigin, cartesianOrigin);
  Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin, enuMatrix);
  attribute.value = offsetsToCartesians(value, cartographicOrigin);

  // TODO fix
  // add back the minHeight to mbs for now
  // tile.mbs[2] = -minHeight;

  return {
    enuMatrix,
    fixedFrameToENUMatrix: enuMatrix.invert(),
    cartographicOrigin,
    cartesianOrigin
  };
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
