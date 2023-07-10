/* eslint-disable camelcase */
import type {
  GLTF,
  GLTF_EXT_feature_metadata_Class,
  GLTF_EXT_feature_metadata_ClassProperty,
  GLTF_EXT_feature_metadata_FeatureTable,
  GLTF_EXT_feature_metadata_FeatureTableProperty,
  GLTF_EXT_feature_metadata_FeatureTexture,
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_TextureAccessor
} from '../../types/gltf-json-schema';
import {GLTFScenegraph} from '../../api/gltf-scenegraph';
import {getImageData} from '@loaders.gl/images';
import {GLTFMeshPrimitive} from '../../types/gltf-json-schema';
import {getComponentTypeFromArray} from '../../gltf-utils/gltf-utils';
import {GLTFLoaderOptions} from '../../../gltf-loader';

/** Extension name */
const EXT_FEATURE_METADATA = 'EXT_feature_metadata';

export const name = EXT_FEATURE_METADATA;

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtFeatureMetadata(scenegraph, options);
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph
 */
function decodeExtFeatureMetadata(scenegraph: GLTFScenegraph, options: GLTFLoaderOptions): void {
  const extension: GLTF_EXT_feature_metadata_GLTF | null =
    scenegraph.getExtension(EXT_FEATURE_METADATA);
  if (!extension) return;

  const schemaClasses = extension.schema?.classes;

  const {featureTables} = extension;
  if (schemaClasses && featureTables) {
    for (const schemaName in schemaClasses) {
      const schemaClass = schemaClasses[schemaName];
      const featureTable = findFeatureTableByName(featureTables, schemaName);

      if (featureTable) {
        handleFeatureTableProperties(scenegraph, featureTable, schemaClass);
      }
    }
  }

  const {featureTextures} = extension;
  if (schemaClasses && featureTextures && options.gltf?.loadImages) {
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
  featureTable: GLTF_EXT_feature_metadata_FeatureTable,
  schemaClass: GLTF_EXT_feature_metadata_Class
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

/**
 * Navigate throw all properies in feature texture and gets properties data.
 * Data will be stored in featureTexture.properties[propertyName].data
 * @param scenegraph
 * @param featureTexture
 * @param schemaClass
 */
function handleFeatureTextureProperties(
  scenegraph: GLTFScenegraph,
  featureTexture: GLTF_EXT_feature_metadata_FeatureTexture,
  schemaClass: GLTF_EXT_feature_metadata_Class
): void {
  const attributeName = featureTexture.class;

  for (const propertyName in schemaClass.properties) {
    const featureTextureProperty = featureTexture?.properties?.[propertyName];

    if (featureTextureProperty) {
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
  schemaProperty: GLTF_EXT_feature_metadata_ClassProperty,
  numberOfFeatures: number,
  featureTableProperty: GLTF_EXT_feature_metadata_FeatureTableProperty
): Uint8Array | string[] {
  const bufferView = featureTableProperty.bufferView;
  // TODO think maybe we shouldn't get data only in Uint8Array format.
  const dataArray: Uint8Array = scenegraph.getTypedArrayForBufferView(bufferView);

  switch (schemaProperty.type) {
    case 'STRING': {
      // stringOffsetBufferView should be available for string type.
      const stringOffsetBufferView = featureTableProperty.stringOffsetBufferView!;
      const offsetsData = scenegraph.getTypedArrayForBufferView(stringOffsetBufferView);
      return getStringAttributes(dataArray, offsetsData, numberOfFeatures);
    }
    default:
  }

  return dataArray;
}

/**
 * Get properties from texture associated with all mesh primitives.
 * @param scenegraph
 * @param featureTextureProperty
 * @param attributeName
 * @returns Feature texture data
 */
function getPropertyDataFromTexture(
  scenegraph: GLTFScenegraph,
  featureTextureProperty: GLTF_EXT_feature_metadata_TextureAccessor,
  attributeName: string
): number[] {
  const json = scenegraph.gltf.json;
  if (!json.meshes) {
    return [];
  }
  const featureTextureTable: number[] = [];
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      processPrimitiveTextures(
        scenegraph,
        attributeName,
        featureTextureProperty,
        featureTextureTable,
        primitive
      );
    }
  }
  return featureTextureTable;
}

// eslint-disable-next-line max-statements
/**
 * Processes data encoded in the texture associated with the primitive. This data will be accessible through the attributes.
 * @param scenegraph
 * @param attributeName
 * @param featureTextureProperty
 * @param featureTextureTable
 * @param primitive
 */
// eslint-disable-next-line max-statements
function processPrimitiveTextures(
  scenegraph: GLTFScenegraph,
  attributeName: string,
  featureTextureProperty: GLTF_EXT_feature_metadata_TextureAccessor,
  featureTextureTable: number[],
  primitive: GLTFMeshPrimitive
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
    if (parsedImage) {
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
  /*
    featureTextureTable will contain unique values, e.g.
      textureData = [24, 35, 28, 24]
      featureTextureTable = [24, 35, 28]
    featureIndices will contain indices hat refer featureTextureTable, e.g.
      featureIndices = [0, 1, 2, 0]
  */
  const featureIndices: number[] = [];
  for (const texelData of textureData) {
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
  featureTables: {[key: string]: GLTF_EXT_feature_metadata_FeatureTable},
  schemaClassName: string
): GLTF_EXT_feature_metadata_FeatureTable | null {
  for (const featureTableName in featureTables) {
    const featureTable = featureTables[featureTableName];

    if (featureTable.class === schemaClassName) {
      return featureTable;
    }
  }

  return null;
}

function findFeatureTextureByName(
  featureTextures: {[key: string]: GLTF_EXT_feature_metadata_FeatureTexture},
  schemaClassName: string
): GLTF_EXT_feature_metadata_FeatureTexture | null {
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
  data: Uint8Array,
  offsetsData: Uint8Array,
  stringsCount: number
): string[] {
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
