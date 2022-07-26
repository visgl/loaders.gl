/* eslint-disable camelcase */
import type {GLTF} from '../../types/gltf-types';

import GLTFScenegraph from '../../api/gltf-scenegraph';
import {
  ClassProperty,
  EXR_feature_metadata_class_object,
  EXT_feature_metadata_feature_table,
  FeatureTableProperty,
  GLTF_EXT_feature_metadata
} from '../../types/gltf-json-schema';

/** Extension name */
const EXT_FEATURE_METADATA = 'EXT_feature_metadata';

export const name = EXT_FEATURE_METADATA;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtFeatureMetadata(scenegraph);
}

/** Decode one meshopt buffer view */
function decodeExtFeatureMetadata(scenegraph: GLTFScenegraph): void {
  const extension: GLTF_EXT_feature_metadata | null = scenegraph.getExtension(EXT_FEATURE_METADATA);
  const schemaClasses = extension?.schema?.classes;
  const featureTables = extension?.featureTables;
  const featureTextures = extension?.featureTextures;

  if (featureTextures) {
    /*
     * TODO add support for featureTextures
     * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-textures
     */
    // eslint-disable-next-line no-console
    console.warn('featureTextures is not yet supported in the "EXT_feature_metadata" extension.');
  }

  if (schemaClasses && featureTables) {
    for (const schemaName in schemaClasses) {
      const schemaClass = schemaClasses[schemaName];
      const featureTable = findFeatureTableByName(featureTables, schemaName);

      if (featureTable) {
        handleFeatureTableProperties(scenegraph, featureTable, schemaClass);
      }
    }
  }
}

function handleFeatureTableProperties(
  scenegraph: GLTFScenegraph,
  featureTable: EXT_feature_metadata_feature_table,
  schemaClass: EXR_feature_metadata_class_object
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

function getPropertyDataFromBinarySource(
  scenegraph: GLTFScenegraph,
  schemaProperty: ClassProperty,
  numberOfFeatures: number,
  featureTableProperty: FeatureTableProperty
): Uint8Array | string[] {
  const bufferView = featureTableProperty.bufferView;
  // TODO think maybe we shouldn't get data only in Uint8Array format.
  let data: Uint8Array | string[] = scenegraph.getTypedArrayForBufferView(bufferView);

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

/**
 * Handling string attributes from binary data.
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
