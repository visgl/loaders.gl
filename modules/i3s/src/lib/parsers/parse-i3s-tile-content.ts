import type {TypedArray} from '@loaders.gl/schema';
import {load, parse} from '@loaders.gl/core';
import {Vector3, Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import {ImageLoader} from '@loaders.gl/images';
import {DracoLoader, DracoMesh} from '@loaders.gl/draco';
import {BasisLoader, CompressedTextureLoader} from '@loaders.gl/textures';

import {
  I3STilesetHeader,
  I3STileHeader,
  FeatureAttribute,
  VertexAttribute,
  I3SMeshAttributes,
  I3SMeshAttribute,
  TileContentTexture,
  HeaderAttributeProperty,
  I3SMaterialDefinition
} from '../../types';
import {getUrlWithToken} from '../utils/url-utils';

import {GL_TYPE_MAP, getConstructorForDataFormat, sizeOf, COORDINATE_SYSTEM} from './constants';

const scratchVector = new Vector3([0, 0, 0]);

function getLoaderForTextureFormat(textureFormat?: 'jpg' | 'png' | 'ktx-etc2' | 'dds' | 'ktx2') {
  switch (textureFormat) {
    case 'ktx-etc2':
    case 'dds':
      return CompressedTextureLoader;
    case 'ktx2':
      return BasisLoader;
    case 'jpg':
    case 'png':
    default:
      return ImageLoader;
  }
}

const I3S_ATTRIBUTE_TYPE = 'i3s-attribute-type';

export async function parseI3STileContent(
  arrayBuffer: ArrayBuffer,
  tile: I3STileHeader,
  tileset: I3STilesetHeader,
  options?: LoaderOptions,
  context?: LoaderContext
) {
  tile.content = tile.content || {};
  tile.content.featureIds = tile.content.featureIds || null;

  tile.content.attributes = {};

  if (tile.textureUrl) {
    const url = getUrlWithToken(tile.textureUrl, options?.i3s?.token);
    const loader = getLoaderForTextureFormat(tile.textureFormat);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    if (options?.i3s.decodeTextures) {
      if (loader === ImageLoader) {
        const options = {...tile.textureLoaderOptions, image: {type: 'data'}};
        try {
          // @ts-ignore context must be defined
          // Image constructor is not supported in worker thread.
          // Do parsing image data on the main thread by using context to avoid worker issues.
          tile.content.texture = await context.parse(arrayBuffer, options);
        } catch (e) {
          // context object is different between worker and node.js conversion script.
          // To prevent error we parse data in ordinary way if it is not parsed by using context.
          tile.content.texture = await parse(arrayBuffer, loader, options);
        }
      } else if (loader === CompressedTextureLoader || loader === BasisLoader) {
        const texture = await load(arrayBuffer, loader, tile.textureLoaderOptions);
        tile.content.texture = {
          compressed: true,
          mipmaps: false,
          width: texture[0].width,
          height: texture[0].height,
          data: texture
        };
      }
    } else {
      tile.content.texture = arrayBuffer;
    }
  }

  tile.content.material = makePbrMaterial(tile.materialDefinition, tile.content.texture);
  if (tile.content.material) {
    tile.content.texture = null;
  }

  return await parseI3SNodeGeometry(arrayBuffer, tile, tileset, options);
}

/* eslint-disable max-statements */
async function parseI3SNodeGeometry(
  arrayBuffer: ArrayBuffer,
  tile: I3STileHeader,
  tileset: I3STilesetHeader,
  options?: LoaderOptions
) {
  if (!tile.content) {
    return tile;
  }

  const content = tile.content;
  let attributes: I3SMeshAttributes;
  let vertexCount: number;
  let byteOffset: number = 0;
  let featureCount: number = 0;
  let indices: TypedArray | undefined;

  if (tile.isDracoGeometry) {
    const decompressedGeometry: DracoMesh = await parse(arrayBuffer, DracoLoader, {
      draco: {
        attributeNameEntry: I3S_ATTRIBUTE_TYPE
      }
    });
    // @ts-expect-error
    vertexCount = decompressedGeometry.header.vertexCount;
    indices = decompressedGeometry.indices?.value;
    const {
      POSITION,
      NORMAL,
      COLOR_0,
      TEXCOORD_0,
      ['feature-index']: featureIndex,
      ['uv-region']: uvRegion
    } = decompressedGeometry.attributes;

    attributes = {
      position: POSITION,
      normal: NORMAL,
      color: COLOR_0,
      uv0: TEXCOORD_0,
      uvRegion,
      id: featureIndex
    };

    updateAttributesMetadata(attributes, decompressedGeometry);

    const featureIds = getFeatureIdsFromFeatureIndexMetadata(featureIndex);

    if (featureIds) {
      flattenFeatureIdsByFeatureIndices(attributes, featureIds);
    }
  } else {
    const {
      vertexAttributes,
      ordering: attributesOrder,
      featureAttributes,
      featureAttributeOrder
    } = tileset.store.defaultGeometrySchema;
    // First 8 bytes reserved for header (vertexCount and featureCount)
    const headers = parseHeaders(tileset, arrayBuffer);
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

    flattenFeatureIdsByFaceRanges(normalizedFeatureAttributes);
    attributes = concatAttributes(normalizedVertexAttributes, normalizedFeatureAttributes);
  }

  if (
    !options?.i3s?.coordinateSystem ||
    options.i3s.coordinateSystem === COORDINATE_SYSTEM.METER_OFFSETS
  ) {
    const enuMatrix = parsePositions(attributes.position, tile);
    content.modelMatrix = enuMatrix.invert();
    content.coordinateSystem = COORDINATE_SYSTEM.METER_OFFSETS;
  } else {
    content.modelMatrix = getModelMatrix(attributes.position);
    content.coordinateSystem = COORDINATE_SYSTEM.LNGLAT_OFFSETS;
  }

  content.attributes = {
    positions: attributes.position,
    normals: attributes.normal,
    colors: normalizeAttribute(attributes.color), // Normalize from UInt8
    texCoords: attributes.uv0,
    uvRegions: normalizeAttribute(attributes.uvRegion) // Normalize from UInt16
  };
  content.indices = indices || null;

  if (attributes.id && attributes.id.value) {
    tile.content.featureIds = attributes.id.value;
  }

  // Remove undefined attributes
  for (const attributeIndex in content.attributes) {
    if (!content.attributes[attributeIndex]) {
      delete content.attributes[attributeIndex];
    }
  }

  content.vertexCount = vertexCount;
  content.byteLength = arrayBuffer.byteLength;

  return tile;
}

/**
 * Update attributes with metadata from decompressed geometry.
 * @param decompressedGeometry
 * @param attributes
 */
function updateAttributesMetadata(
  attributes: I3SMeshAttributes,
  decompressedGeometry: DracoMesh
): void {
  for (const key in decompressedGeometry.loaderData.attributes) {
    const dracoAttribute = decompressedGeometry.loaderData.attributes[key];

    switch (dracoAttribute.name) {
      case 'POSITION':
        attributes.position.metadata = dracoAttribute.metadata;
        break;
      case 'feature-index':
        attributes.id.metadata = dracoAttribute.metadata;
        break;
      default:
        break;
    }
  }
}

/**
 * Do concatenation of attribute objects.
 * Done as separate fucntion to avoid ts errors.
 * @param normalizedVertexAttributes
 * @param normalizedFeatureAttributes
 * @returns - result of attributes concatenation.
 */
function concatAttributes(
  normalizedVertexAttributes: I3SMeshAttributes,
  normalizedFeatureAttributes: I3SMeshAttributes
): I3SMeshAttributes {
  return {...normalizedVertexAttributes, ...normalizedFeatureAttributes};
}

/**
 * Normalize attribute to range [0..1] . Eg. convert colors buffer from [255,255,255,255] to [1,1,1,1]
 * @param attribute - geometry attribute
 * @returns - geometry attribute in right format
 */
function normalizeAttribute(attribute: I3SMeshAttribute): I3SMeshAttribute {
  if (!attribute) {
    return attribute;
  }
  attribute.normalized = true;
  return attribute;
}

function parseHeaders(tileset: I3STilesetHeader, arrayBuffer: ArrayBuffer) {
  let byteOffset = 0;
  // First 8 bytes reserved for header (vertexCount and featurecount)
  let vertexCount = 0;
  let featureCount = 0;
  for (const {property, type} of tileset.store.defaultGeometrySchema.header) {
    const TypedArrayTypeHeader = getConstructorForDataFormat(type);
    switch (property) {
      case HeaderAttributeProperty.vertexCount:
        vertexCount = new TypedArrayTypeHeader(arrayBuffer, 0, 4)[0];
        byteOffset += sizeOf(type);
        break;
      case HeaderAttributeProperty.featureCount:
        featureCount = new TypedArrayTypeHeader(arrayBuffer, 4, 4)[0];
        byteOffset += sizeOf(type);
        break;
      default:
        break;
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
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  vertexAttributes: VertexAttribute | FeatureAttribute,
  vertexCount: number,
  attributesOrder: string[]
) {
  const attributes: I3SMeshAttributes = {};

  // the order of attributes depend on the order being added to the vertexAttributes object
  for (const attribute of attributesOrder) {
    if (vertexAttributes[attribute]) {
      const {valueType, valuesPerElement}: {valueType: string; valuesPerElement: number} =
        vertexAttributes[attribute];
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
      const buffer = arrayBuffer.slice(byteOffset);
      let value: TypedArray;

      if (valueType === 'UInt64') {
        value = parseUint64Values(buffer, count * valuesPerElement, sizeOf(valueType));
      } else {
        const TypedArrayType = getConstructorForDataFormat(valueType);
        value = new TypedArrayType(buffer, 0, count * valuesPerElement);
      }

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

      byteOffset = byteOffset + count * valuesPerElement * sizeOf(valueType);
    }
  }

  return {attributes, byteOffset};
}

/**
 * Parse buffer to return array of uint64 values
 *
 * @param buffer
 * @param elementsCount
 * @returns 64-bit array of values until precision is lost after Number.MAX_SAFE_INTEGER
 */
function parseUint64Values(
  buffer: ArrayBuffer,
  elementsCount: number,
  attributeSize: number
): Uint32Array {
  const values: number[] = [];
  const dataView = new DataView(buffer);
  let offset = 0;

  for (let index = 0; index < elementsCount; index++) {
    // split 64-bit number into two 32-bit parts
    const left = dataView.getUint32(offset, true);
    const right = dataView.getUint32(offset + 4, true);
    // combine the two 32-bit values
    const value = left + 2 ** 32 * right;

    values.push(value);
    offset += attributeSize;
  }

  return new Uint32Array(values);
}

function parsePositions(attribute: I3SMeshAttribute, tile: I3STileHeader): Matrix4 {
  const mbs = tile.mbs;
  const value = attribute.value;
  const metadata = attribute.metadata;
  const enuMatrix = new Matrix4();
  const cartographicOrigin = new Vector3(mbs[0], mbs[1], mbs[2]);
  const cartesianOrigin = new Vector3();
  Ellipsoid.WGS84.cartographicToCartesian(cartographicOrigin, cartesianOrigin);
  Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin, enuMatrix);
  attribute.value = offsetsToCartesians(value, metadata, cartographicOrigin);

  return enuMatrix;
}

/**
 * Converts position coordinates to absolute cartesian coordinates
 * @param vertices - "position" attribute data
 * @param metadata - When the geometry is DRACO compressed, contain position attribute's metadata
 *  https://github.com/Esri/i3s-spec/blob/master/docs/1.7/compressedAttributes.cmn.md
 * @param cartographicOrigin - Cartographic origin coordinates
 * @returns - converted "position" data
 */
function offsetsToCartesians(
  vertices: number[] | TypedArray,
  metadata: any = {},
  cartographicOrigin: Vector3
): Float64Array {
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
 * Get model matrix for loaded vertices
 * @param positions positions attribute
 * @returns Matrix4 - model matrix for geometry transformation
 */
function getModelMatrix(positions: I3SMeshAttribute): Matrix4 {
  const metadata = positions.metadata;
  const scaleX: number = metadata?.['i3s-scale_x']?.double || 1;
  const scaleY: number = metadata?.['i3s-scale_y']?.double || 1;
  const modelMatrix = new Matrix4();
  modelMatrix[0] = scaleX;
  modelMatrix[5] = scaleY;
  return modelMatrix;
}

/**
 * Makes a glTF-compatible PBR material from an I3S material definition
 * @param materialDefinition - i3s material definition
 *  https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
 * @param texture - texture image
 * @returns {object}
 */
function makePbrMaterial(materialDefinition?: I3SMaterialDefinition, texture?: TileContentTexture) {
  let pbrMaterial;
  if (materialDefinition) {
    pbrMaterial = {
      ...materialDefinition,
      pbrMetallicRoughness: materialDefinition.pbrMetallicRoughness
        ? {...materialDefinition.pbrMetallicRoughness}
        : {baseColorFactor: [255, 255, 255, 255]}
    };
  } else {
    pbrMaterial = {
      pbrMetallicRoughness: {}
    };
    if (texture) {
      pbrMaterial.pbrMetallicRoughness.baseColorTexture = {texCoord: 0};
    } else {
      pbrMaterial.pbrMetallicRoughness.baseColorFactor = [255, 255, 255, 255];
    }
  }

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

  if (texture) {
    setMaterialTexture(pbrMaterial, texture);
  }

  return pbrMaterial;
}

/**
 * Convert color from [255,255,255,255] to [1,1,1,1]
 * @param colorFactor - color array
 * @returns - new color array
 */
function convertColorFormat(colorFactor: number[]): number[] {
  const normalizedColor = [...colorFactor];
  for (let index = 0; index < colorFactor.length; index++) {
    normalizedColor[index] = colorFactor[index] / 255;
  }
  return normalizedColor;
}

/**
 * Set texture in PBR material
 * @param {object} material - i3s material definition
 * @param image - texture image
 * @returns
 */
function setMaterialTexture(material, image: TileContentTexture): void {
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

/**
 * Flatten feature ids using face ranges
 * @param normalizedFeatureAttributes
 * @returns
 */
function flattenFeatureIdsByFaceRanges(normalizedFeatureAttributes: I3SMeshAttributes): void {
  const {id, faceRange} = normalizedFeatureAttributes;

  if (!id || !faceRange) {
    return;
  }

  const featureIds = id.value;
  const range = faceRange.value;
  const featureIdsLength = range[range.length - 1] + 1;
  const orderedFeatureIndices = new Uint32Array(featureIdsLength * 3);

  let featureIndex = 0;
  let startIndex = 0;

  for (let index = 1; index < range.length; index += 2) {
    const fillId = Number(featureIds[featureIndex]);
    const endValue = range[index];
    const prevValue = range[index - 1];
    const trianglesCount = endValue - prevValue + 1;
    const endIndex = startIndex + trianglesCount * 3;

    orderedFeatureIndices.fill(fillId, startIndex, endIndex);

    featureIndex++;
    startIndex = endIndex;
  }

  normalizedFeatureAttributes.id.value = orderedFeatureIndices;
}

/**
 * Flatten feature ids using featureIndices
 * @param attributes
 * @param featureIds
 * @returns
 */
function flattenFeatureIdsByFeatureIndices(
  attributes: I3SMeshAttributes,
  featureIds: Int32Array
): void {
  const featureIndices = attributes.id.value;
  const result = new Float32Array(featureIndices.length);

  for (let index = 0; index < featureIndices.length; index++) {
    result[index] = featureIds[featureIndices[index]];
  }

  attributes.id.value = result;
}

/**
 * Flatten feature ids using featureIndices
 * @param featureIndex
 * @returns
 */
function getFeatureIdsFromFeatureIndexMetadata(
  featureIndex: I3SMeshAttribute
): Int32Array | undefined {
  return featureIndex?.metadata?.['i3s-feature-ids']?.intArray;
}
