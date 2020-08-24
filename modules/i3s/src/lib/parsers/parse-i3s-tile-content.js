import {Vector3, Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {parse} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

import {
  GL_TYPE_MAP,
  TYPE_ARRAY_MAP,
  TYPED_ARRAY_CONSTRUCTORS,
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

  return await parseI3SNodeGeometry(arrayBuffer, tile, tileset);
}

/* eslint-disable max-statements */
async function parseI3SNodeGeometry(arrayBuffer, tile = {}, tileset) {
  if (!tile.content) {
    return tile;
  }

  const content = tile.content;
  let attributes;
  let vertexCount;
  let byteOffset = 0;
  const geometryBuffers =
    (tileset &&
      tileset.geometryDefinitions &&
      tileset.geometryDefinitions[0] &&
      tileset.geometryDefinitions[0].geometryBuffers &&
      tileset.geometryDefinitions[0].geometryBuffers) ||
    [];
  const dracoGeometryIndex = geometryBuffers.findIndex(
    buffer => buffer.compressedAttributes && buffer.compressedAttributes.encoding === 'draco'
  );
  if (dracoGeometryIndex !== -1) {
    const decompressedGeometry = await parse(arrayBuffer, DracoLoader);
    vertexCount = decompressedGeometry.header.vertexCount;
    const indices = decompressedGeometry.indices.value;
    const {POSITION, NORMAL, COLOR_0, TEXCOORD_0} = decompressedGeometry.attributes;
    attributes = {
      position: flattenAttribute(POSITION, indices, vertexCount),
      normal: flattenAttribute(NORMAL, indices, vertexCount),
      color: flattenAttribute(COLOR_0, indices, vertexCount),
      uv0: flattenAttribute(TEXCOORD_0, indices, vertexCount)
    };
  } else {
    const {vertexAttributes, attributesOrder} = content.featureData;
    // First 8 bytes reserved for header (vertexCount and featureCount)
    const headers = parseHeaders(content, arrayBuffer);
    byteOffset = headers.byteOffset;
    vertexCount = headers.vertexCount;
    const attributesObject = normalizeAttributes(
      arrayBuffer,
      byteOffset,
      vertexAttributes,
      vertexCount,
      attributesOrder
    );
    attributes = attributesObject.attributes;
  }

  const {enuMatrix, cartographicOrigin, cartesianOrigin} = parsePositions(
    attributes.position,
    tile
  );

  const matrix = new Matrix4().multiplyRight(enuMatrix);

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

function flattenAttribute(attribute, indices, vertexCount) {
  const TypedArrayConstructor = TYPED_ARRAY_CONSTRUCTORS[attribute.value.constructor.name];
  const result = new TypedArrayConstructor(indices.length * attribute.size);
  for (let i = 0; i < indices.length; i++) {
    const vertexIndex = indices[i] * attribute.size;
    if (vertexIndex >= attribute.value.length) {
      throw new Error('Index is out of bounds of attribute array');
    }
    const vertex = attribute.value.subarray(vertexIndex, vertexIndex + attribute.size);
    for (let j = 0; j < attribute.size; j++) {
      result[i * attribute.size + j] = vertex[j];
    }
  }
  return {size: attribute.size, value: result};
}

function constructFeatureDataStruct(tile, tileset) {
  // seed featureData from defaultGeometrySchema
  const defaultGeometrySchema = tileset.store.defaultGeometrySchema;
  const featureData = defaultGeometrySchema;
  // populate the vertex attributes value types and values per element
  for (const geometryAttribute in I3S_NAMED_GEOMETRY_ATTRIBUTES) {
    for (const namedAttribute in I3S_NAMED_VERTEX_ATTRIBUTES) {
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
      // protect from arrayBuffer read overunns by NOT assuming node has regions always even though its declared in defaultGeometrySchema.
      // In i3s 1.6: client is required to decide that based on ./shared resource of the node (materialDefinitions.[Mat_id].params.vertexRegions == true)
      // In i3s 1.7 the property has been rolled into the 3d scene layer json/node pages.
      // Code below does not account when the bytelength is actually bigger than
      // the calculated value (b\c the tile potentially could have mesh segmentation information).
      // In those cases tiles without regions could fail or have garbage values.
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

      switch (attribute) {
        case 'color':
          attributes.color.normalized = true;
          break;
        case 'position':
        case 'region':
        case 'normal':
        default:
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
    // @ts-ignore
    Ellipsoid.WGS84.cartographicToCartesian(positions.subarray(i, i + 3), scratchVector);
    positions[i] = scratchVector.x;
    positions[i + 1] = scratchVector.y;
    positions[i + 2] = scratchVector.z;
  }

  return positions;
}
