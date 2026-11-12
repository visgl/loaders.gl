/* eslint-disable camelcase */
import type {FeatureTableJson} from '@loaders.gl/tiles-3d/3d-tiles';
import type {Attribute} from '@loaders.gl/tiles-3d/i3s';
import type {
  GLTF,
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_ClassProperty,
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_ClassProperty
} from '@loaders.gl/scene/gltf';

import {AttributeType} from '../types';

import {EXT_FEATURE_METADATA, EXT_STRUCTURAL_METADATA} from '@loaders.gl/scene/gltf';

/**
 * Select batch-table rows in geometry feature order, including repeated or missing rows.
 * Missing values become null; zero and empty strings remain valid values.
 * @param batchIds - original batch-table row indices in geometry feature order
 * @param propertyTable - source tile's metadata columns
 */
export function flattenPropertyTableByFeatureIds(
  batchIds: number[],
  propertyTable: FeatureTableJson
): FeatureTableJson {
  const resultPropertyTable: FeatureTableJson = {};
  for (const propertyName in propertyTable) {
    const properties = propertyTable[propertyName];
    resultPropertyTable[propertyName] = batchIds.map(batchId => properties?.[batchId] ?? null);
  }
  return resultPropertyTable;
}

/**
 * Get the attribute type for attributeStorageInfo https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param attribute - attribute taken from propertyTable
 */
export function getAttributeType(attribute: unknown): string {
  if (typeof attribute === 'string' || typeof attribute === 'bigint') {
    return AttributeType.STRING_TYPE;
  } else if (typeof attribute === 'number') {
    return Number.isInteger(attribute) && attribute > -0x80000000 && attribute <= 0x7fffffff
      ? AttributeType.SHORT_INT_TYPE
      : AttributeType.DOUBLE_TYPE;
  }
  return AttributeType.STRING_TYPE;
}

/**
 * Gets attribute's types based on the property table records.
 * @param propertyTable - Table with layer meta data.
 * @returns set of attribute types
 * @example of returned object:
 * {
 *   "opt_uint8":  "Int32",
 *   "opt_uint64": "string"
 * }
 */
export function getAttributeTypesMapFromPropertyTable(
  propertyTable: FeatureTableJson
): Record<string, Attribute> {
  const attributeTypesMap: Record<string, Attribute> = {};
  for (const key in propertyTable) {
    // Get attribute type based on the first element of each property.
    const firstAttribute = propertyTable[key][0];
    const attributeType = getAttributeType(firstAttribute);
    attributeTypesMap[key] = attributeType;
  }
  return attributeTypesMap;
}

/**
 * Gets attribute's types from the extension schema selected by the class name 'metadataClass'.
 * @param gltfJson - JSON part of GLB content
 * @param metadataClass - name of the schema class
 * @returns set of attribute's types
 * @example of returned object:
 * {
 *   "opt_uint8":  "Int32",
 *   "opt_uint64": "string"
 * }
 */
export const getAttributeTypesMapFromSchema = (
  gltfJson: GLTF,
  metadataClass: string
): Record<string, Attribute> | null => {
  const attributeTypesMap: Record<string, Attribute> = {};
  const extFeatureMetadataSchemaClass = (
    gltfJson.extensions?.[EXT_FEATURE_METADATA] as GLTF_EXT_feature_metadata_GLTF
  )?.schema?.classes?.[metadataClass];
  if (extFeatureMetadataSchemaClass) {
    for (const propertyName in extFeatureMetadataSchemaClass.properties) {
      const property = extFeatureMetadataSchemaClass.properties[propertyName];
      const attributeProperty = getAttributeTypeFromExtFeatureMetadata(property);
      attributeTypesMap[propertyName] = attributeProperty;
    }
    return attributeTypesMap;
  }

  const extStructuralMetadataSchemaClass = (
    gltfJson.extensions?.[EXT_STRUCTURAL_METADATA] as GLTF_EXT_structural_metadata_GLTF
  )?.schema?.classes?.[metadataClass];
  if (extStructuralMetadataSchemaClass) {
    for (const propertyName in extStructuralMetadataSchemaClass.properties) {
      const property = extStructuralMetadataSchemaClass.properties[propertyName];
      const attributeProperty = getAttributeTypeFromExtStructuralMetadata(property);
      attributeTypesMap[propertyName] = attributeProperty;
    }
    return attributeTypesMap;
  }

  return null;
};

/**
 * Gets the attribute type according to the Ext_feature_metadata extension class schema
 * @see https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param property - schema of the class property for Ext_feature_metadata
 * @returns attribute's type
 */
// eslint-disable-next-line complexity
const getAttributeTypeFromExtFeatureMetadata = (
  property: GLTF_EXT_feature_metadata_ClassProperty
): Attribute => {
  let attributeType: Attribute;
  switch (property.type) {
    case 'INT8':
    case 'UINT8':
    case 'INT16':
    case 'UINT16':
    case 'INT32':
    case 'UINT32':
      attributeType = AttributeType.SHORT_INT_TYPE;
      break;

    case 'FLOAT32':
    case 'FLOAT64':
      attributeType = AttributeType.DOUBLE_TYPE;
      break;

    case 'INT64':
    case 'UINT64':
    case 'BOOLEAN':
    case 'ENUM':
    case 'STRING':
    case 'ARRAY':
      attributeType = AttributeType.STRING_TYPE;
      break;

    default:
      attributeType = AttributeType.STRING_TYPE;
      break;
  }
  return attributeType;
};

/**
 * Gets the attribute type according to the Ext_structural_metadata extension class schema
 * @see https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param property - schema of the class property for Ext_structural_metadata
 * @returns attribute's type
 */
// eslint-disable-next-line complexity
const getAttributeTypeFromExtStructuralMetadata = (
  property: GLTF_EXT_structural_metadata_ClassProperty
): Attribute => {
  let attributeType: Attribute;
  if (property.array) {
    attributeType = AttributeType.STRING_TYPE;
  } else {
    switch (property.componentType) {
      case 'INT8':
      case 'UINT8':
      case 'INT16':
      case 'UINT16':
      case 'INT32':
      case 'UINT32':
        attributeType = AttributeType.SHORT_INT_TYPE;
        break;

      case 'FLOAT32':
      case 'FLOAT64':
        attributeType = AttributeType.DOUBLE_TYPE;
        break;

      case 'INT64':
      case 'UINT64':
        attributeType = AttributeType.STRING_TYPE;
        break;

      default:
        attributeType = AttributeType.STRING_TYPE;
        break;
    }
  }
  return attributeType;
};

/**
 * Collects a stable batch-table schema before nodes are written. Null-only columns
 * defer type selection; numeric columns widen to Float64 and mixed columns to String.
 */
export function collectBatchTableAttributeTypes(
  propertyTable: FeatureTableJson,
  attributeTypes: Map<string, Attribute | null>
): void {
  for (const [name, values] of Object.entries(propertyTable)) {
    if (name === 'OBJECTID' || !Array.isArray(values)) {
      continue;
    }
    let type = attributeTypes.get(name) ?? null;
    for (const value of values) {
      if (value === null || value === undefined) {
        continue;
      }
      const valueType = getAttributeType(value) as Attribute;
      if (!type) {
        type = valueType;
      } else if (type !== valueType) {
        type =
          type === AttributeType.STRING_TYPE || valueType === AttributeType.STRING_TYPE
            ? AttributeType.STRING_TYPE
            : AttributeType.DOUBLE_TYPE;
      }
    }
    attributeTypes.set(name, type);
  }
}
