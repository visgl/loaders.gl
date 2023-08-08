import type {GLTFTextureInfoMetadata, GLTFMeshPrimitive} from '../types/gltf-json-schema';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {getComponentTypeFromArray} from '../gltf-utils/gltf-utils';
import {getImageData} from '@loaders.gl/images';

/**
 * Processes data encoded in the texture associated with the primitive.
 * If Ext_mesh_featues is combined with the Ext_structural_metadata, propertyTable will also be processed.
 * @param scenegraph
 * @param textureInfo
 * @param propertyTable
 * @param primitive
 */
// eslint-disable-next-line max-statements
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
        The value of "TEXCOORD_1" is an accessor that is used to get coordinates. These coordinates ared used to get data from the image.
    */
  const json = scenegraph.gltf.json;

  // TODO: Is there a default?
  const texCoordAccessorKey = `TEXCOORD_${textureInfo.texCoord || 0}`;
  const texCoordAccessorIndex = primitive.attributes[texCoordAccessorKey];
  const texCoordBufferView = scenegraph.getBufferView(texCoordAccessorIndex);
  const texCoordArray: Uint8Array = scenegraph.getTypedArrayForBufferView(texCoordBufferView);

  const textureCoordinates: Float32Array = new Float32Array(
    texCoordArray.buffer,
    texCoordArray.byteOffset,
    texCoordArray.length / 4
  );
  // textureCoordinates contains UV coordinates of the actual data stored in the texture
  // accessor.count is a number of UV pairs (they are stored as VEC2)

  // TODO: Is there a default?
  const textureIndex: number = textureInfo.index || 0;
  const imageIndex = json.textures?.[textureIndex]?.source;
  if (typeof imageIndex !== 'undefined') {
    const mimeType = json.images?.[imageIndex]?.mimeType;
    const parsedImage = scenegraph.gltf.images?.[imageIndex];
    // TODO: Checking for width is to prevent handling Un-processed images (e.g. [analyze] stage, where loadImages option is set to false)
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

export function getPropertyTableDataByTextureData(
  propertyTable: unknown[],
  textureData: number[]
): unknown[] | null {
  const propertyData: unknown[] = [];
  for (const texelData of textureData) {
    const d = propertyTable[texelData];
    propertyData.push(d);
  }
  return propertyData;
}

/**
 * Put property data to attributes.
 * It creates corresponding buffer, bufferView and accessor
 * so the data can be accessed like regular data stored in buffers.
 * @param scenegraph - scenegraph object
 * @param attributeName - name of the attribute
 * @param propertyData - property data to store
 * @param featureTextureTable - an array where unique data from the property data are being stored 
 * @param primitive - primitive object
 */
export function primitivePropertyDataToAttributes(
  scenegraph: GLTFScenegraph,
  attributeName: string,
  propertyData: number[] | null,
  featureTextureTable: number[],
  primitive: GLTFMeshPrimitive
): void {
  if (propertyData === null) return;
  /*
    featureTextureTable will contain unique values, e.g.
    textureData = [24, 35, 28, 24]
    featureTextureTable = [24, 35, 28]
    featureIndices will contain indices that refer featureTextureTable, e.g.
    featureIndices = [0, 1, 2, 0]
  */
  const featureIndices: number[] = [];
  for (const texelData of propertyData) {
    let index = featureTextureTable.findIndex((item) => item === texelData);
    if (index === -1) {
      index = featureTextureTable.push(texelData) - 1;
    }
    featureIndices.push(index);
  }
  const typedArray = new Uint32Array(featureIndices);
  const bufferIndex =
    scenegraph.gltf.buffers.push({
      arrayBuffer: typedArray.buffer,
      byteOffset: 0,
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

function getImageValueByCoordinates(
  parsedImage: any,
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
  let value = 0;
  for (const c of channels) {
    const map = CHANNELS_MAP[c];
    const val = getVal(parsedImage, offset + map.offset);
    value |= val << map.shift;
  }
  return value;
}

function getVal(parsedImage: any, offset: number): number {
  const imageData = getImageData(parsedImage);
  if (imageData.data.length <= offset) {
    throw new Error(`${imageData.data.length} <= ${offset}`);
  }
  return imageData.data[offset];
}

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

// The following is taken from tile-converter\src\i3s-converter\helpers\batch-ids-extensions.ts
/**
 * Handle UVs if they are out of range [0,1].
 * @param n
 */
function emod(n: number): number {
  const a = ((n % 1) + 1) % 1;
  return a;
}
