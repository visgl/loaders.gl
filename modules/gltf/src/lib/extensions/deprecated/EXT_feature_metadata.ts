/* eslint-disable camelcase */
import type {GLTF} from '../../types/gltf-types';

import GLTFScenegraph from '../../api/gltf-scenegraph';
import {getImageData} from '@loaders.gl/images';

import {
  ClassProperty,
  EXT_feature_metadata_class_object,
  EXT_feature_metadata_feature_table,
  FeatureTableProperty,
  GLTF_EXT_feature_metadata,
  EXT_feature_metadata_feature_texture,
  FeatureTextureProperty,
  MeshPrimitive
} from '../../types/gltf-json-schema';
import {getComponentTypeFromArray} from '../../gltf-utils/gltf-utils';

/** Extension name */
const EXT_FEATURE_METADATA = 'EXT_feature_metadata';

export const name = EXT_FEATURE_METADATA;

export async function decode(gltfData: {json: GLTF}, options): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  // TODO: Consider passing the Converter class in an additional "options" parameter
  // const converter = options.converter;
  // Pass converter to decodeExtFeatureMetadata (matbe using the scenegraph object)
  decodeExtFeatureMetadata(scenegraph);
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph
 */
function decodeExtFeatureMetadata(scenegraph: GLTFScenegraph): void {
  const extension: GLTF_EXT_feature_metadata | null = scenegraph.getExtension(EXT_FEATURE_METADATA);
  if (!extension) return;

  const schemaClasses = extension.schema?.classes;

  const featureTables = extension.featureTables;
  if (schemaClasses && featureTables) {
    for (const schemaName in schemaClasses) {
      const schemaClass = schemaClasses[schemaName];
      const featureTable = findFeatureTableByName(featureTables, schemaName);

      if (featureTable) {
        handleFeatureTableProperties(scenegraph, featureTable, schemaClass);
      }
    }
  }

  // The following handling of featureTextures must be done AFTER handling of featureTables,
  // because handleFeatureTextureProperties creates new featureTables, that can have bufferView===-1, which brakes loading code.
  const featureTextures = extension.featureTextures;
  if (schemaClasses && featureTextures) {
    /*
     * TODO add support for featureTextures
     * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-textures
     */

    for (const schemaName in schemaClasses) {
      const schemaClass = schemaClasses[schemaName];
      const featureTexture = findFeatureTextureByName(featureTextures, schemaName);

      if (featureTexture) {
        handleFeatureTextureProperties(scenegraph, featureTexture, schemaClass);
      }
    }
  }
}

/**
 * Navigate throw all properies in feature table and gets properties data.
 * @param scenegraph
 * @param featureTable
 * @param schemaClass
 */
function handleFeatureTableProperties(
  scenegraph: GLTFScenegraph,
  featureTable: EXT_feature_metadata_feature_table,
  schemaClass: EXT_feature_metadata_class_object
): void {
  for (const propertyName in schemaClass.properties) {
    const schemaProperty = schemaClass.properties[propertyName];
    const featureTableProperty = featureTable?.properties?.[propertyName];
    const numberOfFeatures = featureTable.count;

    if (featureTableProperty) {
      const data = getPropertyDataFromBinarySource(
        scenegraph,
        schemaProperty,
        numberOfFeatures,
        featureTableProperty
      );
      featureTableProperty.data = data;
    }
  }
}

function handleFeatureTextureProperties(
  scenegraph: GLTFScenegraph,
  featureTexture: EXT_feature_metadata_feature_texture,
  schemaClass: EXT_feature_metadata_class_object
): void {
  const attributeName = featureTexture.class;

  for (const propertyName in schemaClass.properties) {
    const featureTextureProperty = featureTexture?.properties?.[propertyName];

    if (featureTextureProperty) {
      // TODO: Check he following logic:
      // We don't need "combined" data from all primitives
      // The per-primitive data are being saved inside this function.
      const data = getPropertyDataFromTexture(scenegraph, featureTextureProperty, attributeName);
      featureTextureProperty.data = data;
    }
  }
}

/**
 * Decode properties from binary sourse based on property type.
 * @param scenegraph
 * @param schemaProperty
 * @param numberOfFeatures
 * @param featureTableProperty
 */
function getPropertyDataFromBinarySource(
  scenegraph: GLTFScenegraph,
  schemaProperty: ClassProperty,
  numberOfFeatures: number,
  featureTableProperty: FeatureTableProperty
): Uint8Array | string[] {
  const bufferView = featureTableProperty.bufferView;
  // TODO think maybe we shouldn't get data only in Uint8Array format.
  let data: Uint8Array | string[];
  if (typeof bufferView === 'number' && bufferView < 0 && featureTableProperty.data) {
    data = featureTableProperty.data;
  } else {
    data = scenegraph.getTypedArrayForBufferView(bufferView);
  }

  switch (schemaProperty.type) {
    case 'STRING': {
      // stringOffsetBufferView should be available for string type.
      const stringOffsetBufferView = featureTableProperty.stringOffsetBufferView!;
      const offsetsData = scenegraph.getTypedArrayForBufferView(stringOffsetBufferView);
      data = getStringAttributes(data, offsetsData, numberOfFeatures);
      break;
    }
    default:
  }

  return data;
}

function getPropertyDataFromTexture(
  scenegraph: GLTFScenegraph,
  featureTextureProperty: FeatureTextureProperty,
  attributeName: string
): number[] {
  const json = scenegraph.gltf.json;
  if (!json.meshes) {
    return [];
  }
  const textureFeatureTable: number[] = [];
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      processPrimitiveTextures(
        scenegraph,
        attributeName,
        featureTextureProperty,
        textureFeatureTable,
        primitive
      );
    }
  }
  return textureFeatureTable;
}

// eslint-disable-next-line max-statements
function processPrimitiveTextures(
  scenegraph: GLTFScenegraph,
  attributeName: string,
  featureTextureProperty: FeatureTextureProperty,
  textureFeatureTable: number[],
  primitive: MeshPrimitive
): void {
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
  const textureData: number[] = [];
  const texCoordAccessorKey = `TEXCOORD_${featureTextureProperty.texture.texCoord}`;
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

  const textureIndex = featureTextureProperty.texture.index;
  const texture = json.textures?.[textureIndex];
  const imageIndex = texture?.source;
  if (typeof imageIndex !== 'undefined') {
    const image = json.images?.[imageIndex];
    const mimeType = image?.mimeType;
    const parsedImage = scenegraph.gltf.images?.[imageIndex];
    const imageBufferView = image?.bufferView;
    if (typeof imageBufferView !== 'undefined' && parsedImage && !parsedImage.compressed) {
      for (let index = 0; index < textureCoordinates.length; index += 2) {
        const value = getImageValueByCoordinates(
          parsedImage,
          mimeType,
          textureCoordinates,
          index,
          featureTextureProperty.channels
        );
        textureData.push(value);
      }
    }
  }
  const featureIndices: number[] = [];
  for (const texelData of textureData) {
    let index = textureFeatureTable.findIndex((item) => item === texelData);
    if (index === -1) {
      index = textureFeatureTable.push(texelData) - 1;
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
  channels: string
) {
  const CHANNELS_MAP = {
    r: {offset: 0, shift: 0},
    g: {offset: 1, shift: 8},
    b: {offset: 2, shift: 16},
    a: {offset: 3, shift: 24}
  };

  const u = textureCoordinates[index];
  const v = textureCoordinates[index + 1];

  let components = 1;
  if (mimeType?.indexOf('image/jpeg') !== -1 || mimeType?.indexOf('image/png') !== -1)
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
  // The follwing code is taken from tile-converter\src\i3s-converter\helpers\batch-ids-extensions.ts (function generateBatchIdsFromTexture)
  // It seems incorrect.
  //  const tx = Math.min((emod(u) * parsedImage.width) | 0, parsedImage.width - 1);
  //  const ty = Math.min((emod(v) * parsedImage.height) | 0, parsedImage.height - 1);
  // It's replaced with the following:
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
 * @param m
 */
function emod(n: number): number {
  const a = ((n % 1) + 1) % 1;
  return a;
}

/**
 * Find the feature table by class name.
 * @param featureTables
 * @param schemaClassName
 */
function findFeatureTableByName(
  featureTables: {[key: string]: EXT_feature_metadata_feature_table},
  schemaClassName: string
): EXT_feature_metadata_feature_table | null {
  for (const featureTableName in featureTables) {
    const featureTable = featureTables[featureTableName];

    if (featureTable.class === schemaClassName) {
      return featureTable;
    }
  }

  return null;
}

function findFeatureTextureByName(
  featureTextures: {[key: string]: EXT_feature_metadata_feature_texture},
  schemaClassName: string
): EXT_feature_metadata_feature_texture | null {
  for (const featureTexturesName in featureTextures) {
    const featureTable = featureTextures[featureTexturesName];

    if (featureTable.class === schemaClassName) {
      return featureTable;
    }
  }

  return null;
}

/**
 * Getting string attributes from binary data.
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata#strings
 * @param data
 * @param offsetsData
 * @param stringsCount
 */
function getStringAttributes(
  data: Uint8Array | string[],
  offsetsData: Uint8Array,
  stringsCount: number
): string[] {
  if (data instanceof Uint8Array) {
    const stringsArray: string[] = [];
    const textDecoder = new TextDecoder('utf8');

    let stringOffset = 0;
    const bytesPerStringSize = 4;

    for (let index = 0; index < stringsCount; index++) {
      // TODO check if it is multiplication on bytesPerStringSize is valid operation?
      const stringByteSize =
        offsetsData[(index + 1) * bytesPerStringSize] - offsetsData[index * bytesPerStringSize];
      const stringData = data.subarray(stringOffset, stringByteSize + stringOffset);
      const stringAttribute = textDecoder.decode(stringData);

      stringsArray.push(stringAttribute);
      stringOffset += stringByteSize;
    }

    return stringsArray;
  }
  return data;
}
