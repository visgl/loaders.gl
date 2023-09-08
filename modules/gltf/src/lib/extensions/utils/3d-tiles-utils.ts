/**
 * loaders.gl, MIT license
 *
 * Shared code for 3DTiles extensions:
 * * EXT_feature_metadata
 * * EXT_mesh_features
 * * EXT_structural_metadata
 */

import type {GLTFTextureInfoMetadata, GLTFMeshPrimitive} from '../../types/gltf-json-schema';
import type {BigTypedArray, TypedArray} from '@loaders.gl/schema';
import type {ImageType} from '@loaders.gl/images';

import {GLTFScenegraph} from '../../api/gltf-scenegraph';
import {getComponentTypeFromArray} from '../../gltf-utils/gltf-utils';
import {getImageData} from '@loaders.gl/images';
import {emod} from '@loaders.gl/math';

const ATTRIBUTE_TYPE_TO_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
  BOOLEAN: 1,
  STRING: 1,
  ENUM: 1
};

const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY = {
  INT8: Int8Array,
  UINT8: Uint8Array,
  INT16: Int16Array,
  UINT16: Uint16Array,
  INT32: Int32Array,
  UINT32: Uint32Array,
  INT64: BigInt64Array,
  UINT64: BigUint64Array,
  FLOAT32: Float32Array,
  FLOAT64: Float64Array
};

const ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE = {
  INT8: 1,
  UINT8: 1,
  INT16: 2,
  UINT16: 2,
  INT32: 4,
  UINT32: 4,
  INT64: 8,
  UINT64: 8,
  FLOAT32: 4,
  FLOAT64: 8
};

export function getArrayElementByteSize(attributeType, componentType): number {
  return (
    ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE[componentType] *
    ATTRIBUTE_TYPE_TO_COMPONENTS[attributeType]
  );
}

/**
 * Gets offset array from `arrayOffsets` or `stringOffsets`.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param bufferViewIndex - Buffer view index
 * @param offsetType - The type of values in `arrayOffsets` or `stringOffsets`.
 * @param numberOfElements - The number of elements in each property array.
 * @returns array with values offsets
 */
export function getOffsetsTypedArray(
  scenegraph: GLTFScenegraph,
  bufferViewIndex: number,
  offsetType: 'UINT8' | 'UINT16' | 'UINT32' | 'UINT64' | string,
  numberOfElements: number
): TypedArray | null {
  if (
    offsetType !== 'UINT8' &&
    offsetType !== 'UINT16' &&
    offsetType !== 'UINT32' &&
    offsetType !== 'UINT64'
  ) {
    return null;
  }
  const arrayOffsetsBytes = scenegraph.getTypedArrayForBufferView(bufferViewIndex);
  const arrayOffsets = convertRawBufferToMetadataArray(
    arrayOffsetsBytes,
    'SCALAR', // offsets consist of ONE component
    offsetType,
    numberOfElements + 1 // The number of offsets is equal to the property table `count` plus one.
  );

  // We don't support BigInt offsets at the moment. It requires additional logic and potential issues in Safari
  if (arrayOffsets instanceof BigInt64Array || arrayOffsets instanceof BigUint64Array) {
    return null;
  }
  return arrayOffsets;
}

/**
 * Converts raw bytes that are in the buffer to an array of the type defined by the schema.
 * @param data - raw bytes in the buffer
 * @param attributeType - SCALAR, VECN, MATN
 * @param componentType - type of the component in elements, e.g. 'UINT8' or 'FLOAT32'
 * @param elementCount - number of elements in the array. Default value is 1.
 * @returns Data array
 */
export function convertRawBufferToMetadataArray(
  data: Uint8Array,
  attributeType: string,
  componentType:
    | 'INT8'
    | 'UINT8'
    | 'INT16'
    | 'UINT16'
    | 'INT32'
    | 'UINT32'
    | 'INT64'
    | 'UINT64'
    | 'FLOAT32'
    | 'FLOAT64',
  elementCount: number = 1
): BigTypedArray | null {
  const numberOfComponents = ATTRIBUTE_TYPE_TO_COMPONENTS[attributeType];
  const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[componentType];
  const size = ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE[componentType];
  const length = elementCount * numberOfComponents;
  const byteLength = length * size;
  let buffer = data.buffer;
  let offset = data.byteOffset;
  if (offset % size !== 0) {
    const bufferArray = new Uint8Array(buffer);
    buffer = bufferArray.slice(offset, offset + byteLength).buffer;
    offset = 0;
  }
  return new ArrayType(buffer, offset, length);
}

/**
 * Processes data encoded in the texture associated with the primitive.
 * If Ext_mesh_featues is combined with the Ext_structural_metadata, propertyTable will also be processed.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param textureInfo - reference to the texture where extension data are stored.
 * @param primitive - primitive object in the mesh
 * @returns Array of data taken. Null if data can't be taken from the texture.
 */
export function getPrimitiveTextureData(
  scenegraph: GLTFScenegraph,
  textureInfo: GLTFTextureInfoMetadata,
  primitive: GLTFMeshPrimitive
): number[] | null {
  /*
    texture.index is an index for the "textures" array.
    The texture object referenced by this index looks like this:
    {
    "sampler": 0,
    "source": 0
    }
    "sampler" is an index for the "samplers" array
    "source" is an index for the "images" array that contains data. These data are stored in rgba channels of the image.

    texture.texCoord is a number-suffix (like 1) for an attribute like "TEXCOORD_1" in meshes.primitives
    The value of "TEXCOORD_1" is an accessor that is used to get coordinates. These coordinates are being used to get data from the image.
  */
  const json = scenegraph.gltf.json;

  const texCoordAccessorKey = `TEXCOORD_${textureInfo.texCoord || 0}`;
  const texCoordAccessorIndex = primitive.attributes[texCoordAccessorKey];
  const texCoordBufferView = scenegraph.getBufferView(texCoordAccessorIndex);
  const texCoordArray: Uint8Array = scenegraph.getTypedArrayForBufferView(texCoordBufferView);

  // textureCoordinates array contains UV coordinates of the actual data stored in the texture
  const textureCoordinates: Float32Array = new Float32Array(
    texCoordArray.buffer,
    texCoordArray.byteOffset,
    texCoordArray.length / 4
  );

  const textureIndex: number = textureInfo.index;
  const imageIndex = json.textures?.[textureIndex]?.source;
  if (typeof imageIndex !== 'undefined') {
    const mimeType = json.images?.[imageIndex]?.mimeType;
    const parsedImage = scenegraph.gltf.images?.[imageIndex];
    // Checking for width is to prevent handling Un-processed images (e.g. [analyze] stage, where loadImages option is set to false)
    if (parsedImage && typeof parsedImage.width !== 'undefined') {
      const textureData: number[] = [];
      for (let index = 0; index < textureCoordinates.length; index += 2) {
        const value = getImageValueByCoordinates(
          parsedImage,
          mimeType,
          textureCoordinates,
          index,
          textureInfo.channels
        );
        textureData.push(value);
      }
      return textureData;
    }
  }
  return null;
}

/**
 * Puts property data to attributes.
 * It creates corresponding buffer, bufferView and accessor
 * so the data can be accessed like regular data stored in buffers.
 * @param scenegraph - scenegraph object
 * @param attributeName - name of the attribute
 * @param propertyData - property data to store
 * @param featureTable - an array where unique data from the property data are being stored
 * @param primitive - primitive object
 */
export function primitivePropertyDataToAttributes(
  scenegraph: GLTFScenegraph,
  attributeName: string,
  propertyData: number[],
  featureTable: number[],
  primitive: GLTFMeshPrimitive
): void {
  if (propertyData === null) return;
  /*
    featureTable will contain unique values, e.g.
    propertyData = [24, 35, 28, 24]
    featureTable = [24, 35, 28]
    featureIndices will contain indices that refer featureTextureTable, e.g.
    featureIndices = [0, 1, 2, 0]
  */
  const featureIndices: number[] = [];
  for (const texelData of propertyData) {
    let index = featureTable.findIndex((item) => item === texelData);
    if (index === -1) {
      index = featureTable.push(texelData) - 1;
    }
    featureIndices.push(index);
  }
  const typedArray = new Uint32Array(featureIndices);
  const bufferIndex =
    scenegraph.gltf.buffers.push({
      arrayBuffer: typedArray.buffer,
      byteOffset: typedArray.byteOffset,
      byteLength: typedArray.byteLength
    }) - 1;
  const bufferViewIndex = scenegraph.addBufferView(typedArray, bufferIndex, 0);
  const accessorIndex = scenegraph.addAccessor(bufferViewIndex, {
    size: 1,
    componentType: getComponentTypeFromArray(typedArray),
    count: typedArray.length
  });
  primitive.attributes[attributeName] = accessorIndex;
}

/**
 * Gets the value from the texture by coordinates provided.
 * @param parsedImage - image where the data are stored.
 * @param mimeType - MIME type
 * @param textureCoordinates - uv coordinates to access data in the image.
 * @param index - index of uv coordinates in the array textureCoordinates
 * @param channels - image channels where data are stored. Channels of an RGBA texture are numbered 0..3 respectively.
 * @returns Value taken from the image.
 */
function getImageValueByCoordinates(
  parsedImage: ImageType,
  mimeType: string | undefined,
  textureCoordinates: Float32Array,
  index: number,
  channels: number[] = [0]
) {
  const CHANNELS_MAP = [
    {offset: 0, shift: 0},
    {offset: 1, shift: 8},
    {offset: 2, shift: 16},
    {offset: 3, shift: 24}
  ];

  const u = textureCoordinates[index];
  const v = textureCoordinates[index + 1];

  let components = 1;
  if (mimeType && (mimeType.indexOf('image/jpeg') !== -1 || mimeType.indexOf('image/png') !== -1))
    components = 4;
  const offset = coordinatesToOffset(u, v, parsedImage, components);
  let value: number = 0;
  for (const c of channels) {
    const map = CHANNELS_MAP[c];
    const imageOffset = offset + map.offset;
    const imageData = getImageData(parsedImage);
    if (imageData.data.length <= imageOffset) {
      throw new Error(`${imageData.data.length} <= ${imageOffset}`);
    }
    const imageValue = imageData.data[imageOffset];
    value |= imageValue << map.shift;
  }
  return value;
}

/**
 * Retrieves the offset in the image where the data are stored
 * @param u - u-coordinate
 * @param v - v-coordinate
 * @param parsedImage - image where the data are stored
 * @param componentsCount - number of components the data consists of.
 * @returns offset in the image where the data are stored
 */
function coordinatesToOffset(
  u: number,
  v: number,
  parsedImage: any,
  componentsCount: number = 1
): number {
  const w = parsedImage.width;
  const iX = emod(u) * (w - 1);
  const indX = Math.round(iX);

  const h = parsedImage.height;
  const iY = emod(v) * (h - 1);
  const indY = Math.round(iY);
  const components = parsedImage.components ? parsedImage.components : componentsCount;
  // components is a number of channels in the image
  const offset = (indY * w + indX) * components;
  return offset;
}
