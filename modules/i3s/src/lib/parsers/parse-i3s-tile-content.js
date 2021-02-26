import {Vector3, Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {parse} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

import {
  GL_TYPE_MAP,
  TYPE_ARRAY_MAP,
  SIZEOF,
  I3S_NAMED_HEADER_ATTRIBUTES,
  I3S_NAMED_VERTEX_ATTRIBUTES,
  I3S_NAMED_GEOMETRY_ATTRIBUTES
} from './constants';
import {getUrlWithToken} from './url-utils';
import {CompressedTextureLoader} from '@loaders.gl/textures';

const scratchVector = new Vector3([0, 0, 0]);

const FORMAT_LOADER_MAP = {
  jpeg: ImageLoader,
  png: ImageLoader,
  'ktx-etc2': CompressedTextureLoader,
  dds: CompressedTextureLoader
};

export async function parseI3STileContent(arrayBuffer, tile, tileset, options) {
  tile.content = tile.content || {};

  // construct featureData from defaultGeometrySchema;
  tile.content.featureData = constructFeatureDataStruct(tile, tileset);
  tile.content.attributes = {};

  if (tile.textureUrl) {
    const url = getUrlWithToken(tile.textureUrl, options.token);
    const loader = FORMAT_LOADER_MAP[tile.textureFormat] || ImageLoader;
    tile.content.texture = await load(url, loader);
    if (loader === CompressedTextureLoader) {
      tile.content.texture = {
        compressed: true,
        mipmaps: false,
        width: tile.content.texture[0].width,
        height: tile.content.texture[0].height,
        data: tile.content.texture
      };
    }
  }

  tile.content.material = makePbrMaterial(tile.materialDefinition, tile.content.texture);

  return await parseI3SNodeGeometry(arrayBuffer, tile, options);
}

/* eslint-disable max-statements */
async function parseI3SNodeGeometry(arrayBuffer, tile = {}, options) {
  if (!tile.content) {
    return tile;
  }

  const content = tile.content;
  let attributes;
  let vertexCount;
  let byteOffset = 0;
  let featureCount = 0;
  if (tile.isDracoGeometry) {
    const decompressedGeometry = await parse(arrayBuffer, DracoLoader);
    vertexCount = decompressedGeometry.header.vertexCount;
    const indices = decompressedGeometry.indices.value;
    const {
      POSITION,
      NORMAL,
      COLOR_0,
      TEXCOORD_0,
      CUSTOM_ATTRIBUTE_3
    } = decompressedGeometry.attributes;
    attributes = {
      position: flattenAttribute(POSITION, indices),
      normal: flattenAttribute(NORMAL, indices),
      color: flattenAttribute(COLOR_0, indices),
      uv0: flattenAttribute(TEXCOORD_0, indices),
      id: flattenAttribute(CUSTOM_ATTRIBUTE_3, indices)
    };
  } else {
    const {
      vertexAttributes,
      attributesOrder,
      featureAttributes,
      featureAttributeOrder
    } = content.featureData;
    // First 8 bytes reserved for header (vertexCount and featureCount)
    const headers = parseHeaders(content, arrayBuffer);
    byteOffset = headers.byteOffset;
    vertexCount = headers.vertexCount;
    featureCount = headers.featureCount;
    // Getting vertex attributes such as positions, normals, colors, etc...
    const {attributes: normalizedVertexAttributes, byteOffset: offset} = normalizeAttributes(
      arrayBuffer,
      byteOffset,
      vertexAttributes,
      vertexCount,
      attributesOrder
    );

    // Getting feature attributes such as featureIds and faceRange
    const {attributes: normalizedFeatureAttributes} = normalizeAttributes(
      arrayBuffer,
      offset,
      featureAttributes,
      featureCount,
      featureAttributeOrder
    );

    // TODO parse Uint64 attributes properly.
    // They are not the same as in compressed attributes.
    // Also featureIds needs to be flatten by face range.
    // Lets set them as new Float32Array(0) for now to avoid error in non compressed attributes.
    normalizedFeatureAttributes.id.value = new Float32Array(
      normalizedVertexAttributes.position.value.length
    );
    attributes = concatAttributes(normalizedVertexAttributes, normalizedFeatureAttributes);
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
    texCoords: attributes.uv0,
    featureIds: attributes.id,
    faceRange: attributes.faceRange
  };

  // Remove undefined attributes
  for (const attributeIndex in content.attributes) {
    if (!content.attributes[attributeIndex]) {
      delete content.attributes[attributeIndex];
    }
  }

  content.vertexCount = vertexCount;
  content.cartographicCenter = cartographicOrigin;
  content.cartesianOrigin = cartesianOrigin;
  content.modelMatrix = matrix.invert();
  content.byteLength = arrayBuffer.byteLength;

  return tile;
}
/**
 * Do concatenation of attribute objects.
 * Done as separate fucntion to avoid ts errors.
 * @param {Object} normalizedVertexAttributes
 * @param {Object} normalizedFeatureAttributes
 * @returns {object} - result of attributes concatenation.
 */
function concatAttributes(normalizedVertexAttributes, normalizedFeatureAttributes) {
  return {...normalizedVertexAttributes, ...normalizedFeatureAttributes};
}

function flattenAttribute(attribute, indices) {
  if (!attribute) {
    return null;
  }
  const TypedArrayConstructor = attribute.value.constructor;
  const result = new TypedArrayConstructor(indices.length * attribute.size);
  for (let i = 0; i < indices.length; i++) {
    const vertexIndex = indices[i] * attribute.size;
    result.set(
      new TypedArrayConstructor(
        attribute.value.buffer,
        vertexIndex * attribute.value.BYTES_PER_ELEMENT,
        attribute.size
      ),
      i * attribute.size
    );
  }
  return {...attribute, value: result};
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
      const buffer = arrayBuffer.slice(byteOffset);
      const value = new TypedArrayType(buffer, 0, count * valuesPerElement);

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
  const metadata = attribute.metadata;
  const enuMatrix = new Matrix4();
  const cartographicOrigin = new Vector3(mbs[0], mbs[1], mbs[2]);
  const cartesianOrigin = new Vector3();
  Ellipsoid.WGS84.cartographicToCartesian(cartographicOrigin, cartesianOrigin);
  Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin, enuMatrix);
  attribute.value = offsetsToCartesians(value, metadata, cartographicOrigin);

  return {
    enuMatrix,
    fixedFrameToENUMatrix: enuMatrix.invert(),
    cartographicOrigin,
    cartesianOrigin
  };
}

/**
 * Converts position coordinates to absolute cartesian coordinates
 * @param {Float32Array} vertices - "position" attribute data
 * @param {Object} metadata - When the geometry is DRACO compressed, contain position attribute's metadata
 *  https://github.com/Esri/i3s-spec/blob/master/docs/1.7/compressedAttributes.cmn.md
 * @param {Vector3} cartographicOrigin - Cartographic origin coordinates
 * @returns {Float64Array} - converted "position" data
 */
function offsetsToCartesians(vertices, metadata = {}, cartographicOrigin) {
  const positions = new Float64Array(vertices.length);
  const scaleX = (metadata['i3s-scale_x'] && metadata['i3s-scale_x'].double) || 1;
  const scaleY = (metadata['i3s-scale_y'] && metadata['i3s-scale_y'].double) || 1;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = vertices[i] * scaleX + cartographicOrigin.x;
    positions[i + 1] = vertices[i + 1] * scaleY + cartographicOrigin.y;
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

/**
 * Makes a glTF-compatible PBR material from an I3S material definition
 * @param {object} materialDefinition - i3s material definition
 *  https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
 * @param {object} texture - texture image
 * @returns {object}
 */
function makePbrMaterial(materialDefinition, texture) {
  if (!materialDefinition) {
    return null;
  }
  const pbrMaterial = {
    ...materialDefinition,
    pbrMetallicRoughness: materialDefinition.pbrMetallicRoughness
      ? {...materialDefinition.pbrMetallicRoughness}
      : {baseColorFactor: [255, 255, 255, 255]}
  };

  // Set default 0.25 per spec https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
  pbrMaterial.alphaCutoff = pbrMaterial.alphaCutoff || 0.25;

  if (pbrMaterial.alphaMode) {
    // I3S contain alphaMode in lowerCase
    pbrMaterial.alphaMode = pbrMaterial.alphaMode.toUpperCase();
  }

  // Convert colors from [255,255,255,255] to [1,1,1,1]
  if (pbrMaterial.emissiveFactor) {
    pbrMaterial.emissiveFactor = convertColorFormat(pbrMaterial.emissiveFactor);
  }
  if (pbrMaterial.pbrMetallicRoughness && pbrMaterial.pbrMetallicRoughness.baseColorFactor) {
    pbrMaterial.pbrMetallicRoughness.baseColorFactor = convertColorFormat(
      pbrMaterial.pbrMetallicRoughness.baseColorFactor
    );
  }

  setMaterialTexture(pbrMaterial, texture);

  return pbrMaterial;
}

/**
 * Convert color from [255,255,255,255] to [1,1,1,1]
 * @param {Array} colorFactor - color array
 * @returns {Array} - new color array
 */
function convertColorFormat(colorFactor) {
  const normalizedColor = [...colorFactor];
  for (let index = 0; index < colorFactor.length; index++) {
    normalizedColor[index] = colorFactor[index] / 255;
  }
  return normalizedColor;
}

/**
 * Set texture in PBR material
 * @param {object} material - i3s material definition
 * @param {object} image - texture image
 * @returns {void}
 */
function setMaterialTexture(material, image) {
  const texture = {source: {image}};
  // I3SLoader now support loading only one texture. This elseif sequence will assign this texture to one of
  // properties defined in materialDefinition
  if (material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture) {
    material.pbrMetallicRoughness.baseColorTexture = {
      ...material.pbrMetallicRoughness.baseColorTexture,
      texture
    };
  } else if (material.emissiveTexture) {
    material.emissiveTexture = {...material.emissiveTexture, texture};
  } else if (
    material.pbrMetallicRoughness &&
    material.pbrMetallicRoughness.metallicRoughnessTexture
  ) {
    material.pbrMetallicRoughness.metallicRoughnessTexture = {
      ...material.pbrMetallicRoughness.metallicRoughnessTexture,
      texture
    };
  } else if (material.normalTexture) {
    material.normalTexture = {...material.normalTexture, texture};
  } else if (material.occlusionTexture) {
    material.occlusionTexture = {...material.occlusionTexture, texture};
  }
}
