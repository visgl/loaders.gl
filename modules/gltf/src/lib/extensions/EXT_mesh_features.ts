/* eslint-disable camelcase */
import type {GLTF} from '../types/gltf-json-schema';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {
  GLTF_EXT_feature_metadata_Class,
  GLTF_EXT_feature_metadata_ClassProperty,
  GLTF_EXT_feature_metadata_FeatureTable,
//  EXT_feature_metadata_class_object,
  GLTF_EXT_mesh_features_featureId,
  GLTF_EXT_feature_metadata_FeatureTableProperty,
  GLTF_EXT_mesh_features
} from '../types/gltf-json-schema';

/** Extension name */
const EXT_MESH_FEATURES = 'EXT_mesh_features';

export const name = EXT_MESH_FEATURES;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtMeshFeatures(scenegraph);
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph
 */
function decodeExtMeshFeatures(scenegraph: GLTFScenegraph): void {
  const extension: GLTF_EXT_mesh_features | null = scenegraph.getExtension(EXT_MESH_FEATURES);
  if (!extension) return;

// TODO: Check it after merge!

// Temp - to compile...
  let propertyTable: GLTF_EXT_feature_metadata_FeatureTable = { count: 0};

  // TODO: temp to compile...
  const schemaClasses = []; //extension.schema?.classes;
  const featureIds: GLTF_EXT_mesh_features_featureId[] = extension.featureIds;

// Actuall featureIds is always here!
  if (featureIds) {
    /*
     * TODO add support for featureTextures
     * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-textures
     */
    // eslint-disable-next-line no-console
    console.warn('featureTextures is not yet supported in the "EXT_feature_metadata" extension.');
  }

  if (schemaClasses && propertyTable) {
    for (const schemaName in schemaClasses) {
      const schemaClass = schemaClasses[schemaName];
      if (propertyTable) {
        //      const featureTable = findFeatureTableByName(propertyTable);

        //      if (featureTable) {
        handlePropertyTableProperties(scenegraph, propertyTable, schemaClass);
        //      }
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
function handlePropertyTableProperties(
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

/**
 * Find the feature table by class name.
 * @param featureTables
 * @param schemaClassName
 */
// function findFeatureTableByName(
//   featureTables: {[key: string]: EXT_feature_metadata_feature_table},
//   schemaClassName: string
// ): EXT_feature_metadata_feature_table | null {
//   for (const featureTableName in featureTables) {
//     const featureTable = featureTables[featureTableName];

//     if (featureTable.class === schemaClassName) {
//       return featureTable;
//     }
//   }

//   return null;
// }

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
