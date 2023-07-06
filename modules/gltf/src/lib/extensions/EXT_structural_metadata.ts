/* eslint-disable camelcase */
import type {GLTF} from '../types/gltf-json-schema';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {
  GLTF_EXT_feature_metadata_Class,
  GLTF_EXT_feature_metadata_ClassProperty,
  EXT_structural_metadata_property_table,
  GLTF_EXT_structural_metadata,
  EXT_structural_metadata_property_texture,
  EXT_structural_metadata_property_table_property,
  GLTFMeshPrimitive,
  GLTFTextureInfoExtStructural
} from '../types/gltf-json-schema';
import {getComponentTypeFromArray} from '../gltf-utils/gltf-utils';
import {getImageData} from '@loaders.gl/images';

/** Extension name */
const EXT_STRUCTURAL_METADATA = 'EXT_structural_metadata';

export const name = EXT_STRUCTURAL_METADATA;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtStructuralMetadata(scenegraph);
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph
 */
function decodeExtStructuralMetadata(scenegraph: GLTFScenegraph): void {
  const extension: GLTF_EXT_structural_metadata | null =
    scenegraph.getExtension(EXT_STRUCTURAL_METADATA);
  if (!extension) return;

  const schemaClasses = extension?.schema?.classes;
  const propertyTables = extension?.propertyTables;
  const propertyTextures = extension?.propertyTextures;

  // Iterate through all meshes/primitives.
  const json = scenegraph.gltf.json;
  if (!json.meshes) {
    return;
  }
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      processPrimitivePropertyTextures(scenegraph, propertyTextures, primitive, extension);
    }
  }

  if (schemaClasses && propertyTables) {
    for (const schemaName in schemaClasses) {
      const schemaClass = schemaClasses[schemaName];
      const propertyTable = findPropertyTableByClass(propertyTables, schemaName);

      if (propertyTable) {
        handlePropertyTableProperties(scenegraph, propertyTable, schemaClass);
      }
    }
  }
}

function processPrimitivePropertyTextures(
  scenegraph: GLTFScenegraph,
  propertyTextures: EXT_structural_metadata_property_texture[] | undefined,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_structural_metadata // top-level extension
): void {
  if (!propertyTextures) return;
  const primitivePropertyTextureIndices =
    primitive.extensions?.[EXT_STRUCTURAL_METADATA]?.propertyTextures;
  if (!primitivePropertyTextureIndices) return;

  for (const primitivePropertyTextureIndex of primitivePropertyTextureIndices) {
    const propertyTexture = propertyTextures[primitivePropertyTextureIndex];
    processTexture(
      scenegraph,
      propertyTexture,
      primitivePropertyTextureIndex,
      primitive,
      extension
    );
  }
}

function processTexture(
  scenegraph: GLTFScenegraph,
  propertyTexture: EXT_structural_metadata_property_texture, // propertyTexture definition taken from the top-level extension
  primitivePropertyTextureIndex: number,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_structural_metadata // top-level extension
): void {
  if (!propertyTexture.properties) return;

  const json = scenegraph.gltf.json;
  /* Iterate through all properties defined in propertyTexture, e.g. "speed" and "direction":
  {
      "class": "wind",
      "properties": {
        "speed": {
          "index": 0,
          "texCoord": 0,
          "channels": [0]
        },
        "direction": {
          "index": 0,
          "texCoord": 0,
          "channels": [1, 2]
        }
      }
    }
  */
  const className = propertyTexture.class;
  for (const propName in propertyTexture.properties) {
    const attributeName = `${className  }_${  propName}`;
    const textureInfoTopLevel: GLTFTextureInfoExtStructural | undefined =
      extension.propertyTextures?.[primitivePropertyTextureIndex].properties?.[propName];
    if (!textureInfoTopLevel) return;
    // The data taken from all meshes/primitives (the same property, e.g. "speed" or "direction") will be combined into one array and saved in textureInfoTopLevel.data
    // Initially textureInfoTopLevel.data will be initialized with an ampty array.
    if (!textureInfoTopLevel.data) {
      textureInfoTopLevel.data = [];
    }
    const featureTextureTable: number[] = textureInfoTopLevel.data;

    const textureData: number[] = [];
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
    const texCoordAccessorKey = `TEXCOORD_${textureInfoTopLevel.texCoord}`;
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

    const textureIndex = textureInfoTopLevel.index;
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
            textureInfoTopLevel.channels
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

    // Create buffers, bufferViews

    // TODO: Consider adding data to ONE buffer and creating individual bufferViews for the same properties. Would it optimal while indexing data?
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
    // Note, that attributeName is a combination of className and propertyName, e.g. "wind_speed" or "wind_direction".
    // So, the data of each property (speed, direction) will be put to separate attributes.
    primitive.attributes[attributeName] = accessorIndex;
  }
}

/**
 * Navigate throw all properies in feature table and gets properties data.
 * @param scenegraph
 * @param featureTable
 * @param schemaClass
 */
function handlePropertyTableProperties(
  scenegraph: GLTFScenegraph,
  propertyTable: EXT_structural_metadata_property_table, // propertyTable definition taken from the top-level extension
  schemaClass: GLTF_EXT_feature_metadata_Class
): void {
  for (const propertyName in schemaClass.properties) {
    const schemaProperty = schemaClass.properties[propertyName];
    const propertyTableProperty: EXT_structural_metadata_property_table_property | undefined =
      propertyTable?.properties?.[propertyName];
    const numberOfProperties = propertyTable.count;

    if (propertyTableProperty) {
      const data = getPropertyDataFromBinarySource(
        scenegraph,
        schemaProperty,
        numberOfProperties,
        propertyTableProperty
      );
      propertyTableProperty.data = data;
    }
  }
}

/**
 * Decode properties from binary sourse based on property type.
 * @param scenegraph
 * @param schemaProperty
 * @param numberOfProperties
 * @param featureTableProperty
 */
function getPropertyDataFromBinarySource(
  scenegraph: GLTFScenegraph,
  schemaProperty: GLTF_EXT_feature_metadata_ClassProperty,
  numberOfProperties: number,
  featureTableProperty: EXT_structural_metadata_property_table_property
): Uint8Array | string[] {
  const bufferView = featureTableProperty.values;
  // TODO think maybe we shouldn't get data only in Uint8Array format.
  let data: Uint8Array | string[] = scenegraph.getTypedArrayForBufferView(bufferView);

  switch (schemaProperty.type) {
    case 'STRING': {
      // stringOffsets should be available for string type.
      const stringOffsetBufferView = featureTableProperty.stringOffsets!;
      const offsetsData = scenegraph.getTypedArrayForBufferView(stringOffsetBufferView);
      data = getStringAttributes(data, offsetsData, numberOfProperties);
      break;
    }
    default:
  }

  return data;
}

/**
 * Find the feature table by class name.
 * @param featureTables
 * @param schemaClassName
 */
function findPropertyTableByClass(
  featureTables: EXT_structural_metadata_property_table[],
  schemaClassName: string
): EXT_structural_metadata_property_table | null {
  for (let i = 0, len = featureTables.length; i < len; i++) {
    const featureTable = featureTables[i];

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
//  const bytesPerStringSize = 4;

  for (let index = 0; index < stringsCount; index++) {
    // TODO check if it is multiplication on bytesPerStringSize is valid operation?
    // const stringByteSize =
    //   offsetsData[(index + 1) * bytesPerStringSize] - offsetsData[index * bytesPerStringSize];

    const stringByteSize =
      offsetsData[(index + 1)] - offsetsData[index];

    // check the offset
    if (stringByteSize + stringOffset > data.length) {
      console.log(`Incorrect string offset: ${stringOffset}, ${stringByteSize}`);
      continue;
    }
    const stringData = data.subarray(stringOffset, stringByteSize + stringOffset);
    const stringAttribute = textDecoder.decode(stringData);

    stringsArray.push(stringAttribute);
    stringOffset += stringByteSize;
  }

  return stringsArray;
}

function getImageValueByCoordinates(
  parsedImage: any,
  mimeType: string | undefined,
  textureCoordinates: Float32Array,
  index: number,
  channels: number[]
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
 * @param m
 */
function emod(n: number): number {
  const a = ((n % 1) + 1) % 1;
  return a;
}
