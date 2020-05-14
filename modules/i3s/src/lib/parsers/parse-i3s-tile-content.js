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
  I3S_NAMED_GEOMETRY_ATTRIBUTES
} from './constants';
import {getUrlWithToken} from './utils';

const scratchVector = new Vector3([0, 0, 0]);

export async function parseI3STileContent(arrayBuffer, tile, tileset, options) {
  tile.content = tile.content || {};

  // construct featureData from defaultGeometrySchema;
  tile.content.featureData = constructFeatureDataStruct(tile, tileset);
  tile.content.attributes = {};

  if (tile.textureUrl) {
    const url = getUrlWithToken(tile.textureUrl, options.token);
    tile.content.texture = await load(url, ImageLoader);
  }

  return parseI3SNodeGeometry(arrayBuffer, tile, tileset);
}

/* eslint-disable max-statements */
function parseI3SNodeGeometry(arrayBuffer, tile = {}) {
  if (!tile.content) {
    return tile;
  }

  const content = tile.content;
  const {vertexAttributes, attributesOrder} = content.featureData;
  // First 8 bytes reserved for header (vertexCount and featureCount)
  const {vertexCount, byteOffset} = parseHeaders(content, arrayBuffer);
  const {attributes} = normalizeAttributes(
    arrayBuffer,
    byteOffset,
    vertexAttributes,
    vertexCount,
    attributesOrder
  );

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
  for (const geometryAttribute in I3S_NAMED_GEOMETRY_ATTRIBUTES) {
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

  featureData.attributesOrder = defaultGeometrySchema.ordering;
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

function normalizeAttributes(
  arrayBuffer,
  byteOffset,
  vertexAttributes,
  vertexCount,
  attributesOrder
) {
  const attributes = {};

  // the order of attributes depend on the order being added to the vertexAttributes object
  for (const attribute of attributesOrder) {
    if (vertexAttributes[attribute]) {
      const {valueType, valuesPerElement} = vertexAttributes[attribute];
      // update count and byteOffset count by calculating from defaultGeometrySchema + binnary content
      const count = vertexCount;

      // vertexAttributes is derived from defaultGeometrySchema
      // some tiles do not have all the vertexAttributes
      if (byteOffset + count * valuesPerElement > arrayBuffer.byteLength) {
        break;
      }

      const TypedArrayType = TYPE_ARRAY_MAP[valueType];
      const value = new TypedArrayType(arrayBuffer, byteOffset, count * valuesPerElement);

      attributes[attribute] = {
        value,
        type: GL_TYPE_MAP[valueType],
        size: valuesPerElement
      };

      if (attribute === 'color') {
        attributes.color.normalized = true;
      }

      if (attribute === 'region') {
        // do nothing for now...
      }

      if (attribute === 'normal') {
        // do nothing for now...
      }

      byteOffset = byteOffset + count * valuesPerElement * SIZEOF[valueType];
    }
  }

  return {attributes, byteOffset};
}

function parsePositions(attribute, tile) {
  const mbs = tile.mbs;
  const value = attribute.value;
  const enuMatrix = new Matrix4();
  const cartographicOrigin = new Vector3(mbs[0], mbs[1], mbs[2]);
  const cartesianOrigin = new Vector3();
  Ellipsoid.WGS84.cartographicToCartesian(cartographicOrigin, cartesianOrigin);
  Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin, enuMatrix);
  attribute.value = offsetsToCartesians(value, cartographicOrigin);

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
