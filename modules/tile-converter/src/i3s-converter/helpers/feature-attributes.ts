import type {AttributeProperty, AttributePropertySet} from '../types';
import type {FeatureTableJson} from '@loaders.gl/3d-tiles';
import type {
  Attribute,
  AttributeStorageInfo,
  ESRIField,
  Field,
  FieldInfo,
  PopupInfo
} from '@loaders.gl/i3s';
import type {
  GLTFPostprocessed,
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_ClassProperty,
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_ClassProperty
} from '@loaders.gl/gltf';

import {EXT_FEATURE_METADATA, EXT_STRUCTURAL_METADATA} from '@loaders.gl/gltf';

/**
 * Takes attributes from property table based on featureIdsMap.
 * If there is no property value for particular featureId (index) the property will be null.
 * Example:
 * Initial data:
 *   OBJECTID: {0: 0, 3: 33, 4: 333}
 *   component: ['Windows', 'Frames', 'Wall', 'Roof', 'Skylight']
 * Result:
 *   OBJECTID: [0, 33, 333]
 *   component: ['Windows', 'Roof', 'Skylight']
 * @param featureIdsMap
 * @param propertyTable
 */
export function flattenPropertyTableByFeatureIds(
  featureIdsMap: Record<string, number>,
  propertyTable: FeatureTableJson
): FeatureTableJson {
  const resultPropertyTable: FeatureTableJson = {};
  for (const propertyName in propertyTable) {
    const properties = propertyTable[propertyName];
    resultPropertyTable[propertyName] = getPropertiesByFeatureIds(properties, featureIdsMap);
  }

  return resultPropertyTable;
}

/**
 * Getting properties by featureId index
 * @param properties
 * @param featureIdsMap
 */
function getPropertiesByFeatureIds(
  properties: unknown[],
  featureIdsMap: Record<string, number>
): unknown[] {
  const resultProperties: unknown[] = [];

  if (properties) {
    for (const featureIdKey in featureIdsMap) {
      const property = properties[featureIdKey] || null;
      resultProperties.push(property);
    }
  }

  return resultProperties;
}

/**
 * Check that all attributes in propertyTable have the same length as FeatureIds.
 * If there are differencies between lengths we should flatten property table based on exiesting featureIds.
 * @param featureIds
 * @param propertyTable
 * @returns
 */
export function checkPropertiesLength(
  featureIds: number[],
  propertyTable: FeatureTableJson
): boolean {
  let needFlatten = false;

  for (const attribute of Object.values(propertyTable)) {
    if (!featureIds || !attribute || featureIds.length !== attribute.length) {
      needFlatten = true;
    }
  }

  return needFlatten;
}

/** String data type name for feature attributes */
const STRING_TYPE = 'string';
/** Integer data type name for feature attributes */
const SHORT_INT_TYPE = 'Int32';
/** Double data type name for feature attributes */
const DOUBLE_TYPE = 'double';
/** Type of attribute that is linked with feature ids */
const OBJECT_ID_TYPE = 'OBJECTID';
/**
 * Get the attribute type for attributeStorageInfo https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param key - attribute's key
 * @param attribute - attribute taken from propertyTable
 */
export function getAttributeType(attribute: unknown): string {
  if (typeof attribute === STRING_TYPE || typeof attribute === 'bigint') {
    return STRING_TYPE;
  } else if (typeof attribute === 'number') {
    return Number.isInteger(attribute) ? SHORT_INT_TYPE : DOUBLE_TYPE;
  }
  return STRING_TYPE;
}

/**
 * Generate storage attribute for map segmentation.
 * @param attributeIndex - order index of attribute (f_0, f_1 ...).
 * @param key - attribute key from propertyTable.
 * @param attributeType - attribute type.
 * @return Updated storageAttribute.
 */
export function createdStorageAttribute(
  attributeIndex: number,
  key: string,
  attributeType: Attribute
): AttributeStorageInfo {
  const storageAttribute = {
    key: `f_${attributeIndex}`,
    name: key,
    ordering: ['attributeValues'],
    header: [{property: 'count', valueType: 'UInt32'}],
    attributeValues: {valueType: 'Int32', valuesPerElement: 1}
  };

  switch (attributeType) {
    case OBJECT_ID_TYPE:
      setupIdAttribute(storageAttribute);
      break;
    case STRING_TYPE:
      setupStringAttribute(storageAttribute);
      break;
    case DOUBLE_TYPE:
      setupDoubleAttribute(storageAttribute);
      break;
    case SHORT_INT_TYPE:
      break;
    default:
      setupStringAttribute(storageAttribute);
  }

  return storageAttribute;
}

/**
 * Find and return attribute type based on key form propertyTable.
 * @param attributeType
 */
export function getFieldAttributeType(attributeType: Attribute): ESRIField {
  switch (attributeType) {
    case OBJECT_ID_TYPE:
      return 'esriFieldTypeOID';
    case STRING_TYPE:
      return 'esriFieldTypeString';
    case SHORT_INT_TYPE:
      return 'esriFieldTypeInteger';
    case DOUBLE_TYPE:
      return 'esriFieldTypeDouble';
    default:
      return 'esriFieldTypeString';
  }
}

/**
 * Setup field attribute for map segmentation.
 * @param key - attribute for map segmentation.
 * @param fieldAttributeType - esri attribute type ('esriFieldTypeString' or 'esriFieldTypeOID').
 */
export function createFieldAttribute(key: string, fieldAttributeType: ESRIField): Field {
  return {
    name: key,
    type: fieldAttributeType,
    alias: key
  };
}

/**
 * Generate popup info to show metadata on the map.
 * @param propertyNames - array of property names including OBJECTID.
 * @return data for correct rendering of popup.
 */
export function createPopupInfo(propertyNames: string[]): PopupInfo {
  const title = '{OBJECTID}';
  const mediaInfos = [];
  const fieldInfos: FieldInfo[] = [];
  const popupElements: {
    fieldInfos: FieldInfo[];
    type: string;
  }[] = [];
  const expressionInfos = [];

  for (const propertyName of propertyNames) {
    fieldInfos.push({
      fieldName: propertyName,
      visible: true,
      isEditable: false,
      label: propertyName
    });
  }
  popupElements.push({
    fieldInfos,
    type: 'fields'
  });

  return {
    title,
    mediaInfos,
    popupElements,
    fieldInfos,
    expressionInfos
  };
}

/**
 * Setup storage attribute as string.
 * @param storageAttribute - attribute for map segmentation.
 */
function setupStringAttribute(storageAttribute: AttributeStorageInfo): void {
  // @ts-expect-error
  storageAttribute.ordering.unshift('attributeByteCounts');
  storageAttribute.header.push({property: 'attributeValuesByteCount', valueType: 'UInt32'});
  storageAttribute.attributeValues = {
    valueType: 'String',
    encoding: 'UTF-8',
    valuesPerElement: 1
  };
  storageAttribute.attributeByteCounts = {
    valueType: 'UInt32',
    valuesPerElement: 1
  };
}

/**
 * Setup Id attribute for map segmentation.
 * @param storageAttribute - attribute for map segmentation .
 */
function setupIdAttribute(storageAttribute: AttributeStorageInfo): void {
  storageAttribute.attributeValues = {
    valueType: 'Oid32',
    valuesPerElement: 1
  };
}

/**
 * Setup double attribute for map segmentation.
 * @param storageAttribute - attribute for map segmentation .
 */
function setupDoubleAttribute(storageAttribute: AttributeStorageInfo): void {
  storageAttribute.attributeValues = {
    valueType: 'Float64',
    valuesPerElement: 1
  };
}

/**
 * Gets attribute's types from the extension schema selected by the class name 'metadataClass'.
 * @param gltfJson - JSON part of GLB content
 * @param metadataClass - name of the schema class
 * @returns set of attribute's types
 * @example of returned object:
 * {
 *   "opt_uint8":  { "propertyType": "Int32" },
 *   "opt_uint64": { "propertyType": "string" }
 * }
 */
export const getAttributePropertiesFromSchema = (
  gltfJson: GLTFPostprocessed,
  metadataClass: string
): AttributePropertySet | null => {
  const schemaClassProperties: AttributePropertySet = {};
  const extFeatureMetadataSchemaClass = (
    gltfJson.extensions?.[EXT_FEATURE_METADATA] as GLTF_EXT_feature_metadata_GLTF
  )?.schema?.classes?.[metadataClass];
  if (extFeatureMetadataSchemaClass) {
    for (let propertyName in extFeatureMetadataSchemaClass.properties) {
      const property = extFeatureMetadataSchemaClass.properties[propertyName];
      const attributeProperty = getAttributeTypeFromExtFeatureMetadata(property);
      schemaClassProperties[propertyName] = attributeProperty;
    }
    return schemaClassProperties;
  }

  const extStructuralMetadataSchemaClass = (
    gltfJson.extensions?.[EXT_STRUCTURAL_METADATA] as GLTF_EXT_structural_metadata_GLTF
  )?.schema?.classes?.[metadataClass];
  if (extStructuralMetadataSchemaClass) {
    for (let propertyName in extStructuralMetadataSchemaClass.properties) {
      const property = extStructuralMetadataSchemaClass.properties[propertyName];
      const attributeProperty = getAttributeTypeFromExtStructuralMetadata(property);
      schemaClassProperties[propertyName] = attributeProperty;
    }
    return schemaClassProperties;
  }

  return null;
};

/**
 * Gets the attribute type for attributeStorageInfo according to the extension class schema
 * @see https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param property - schema of the class property for Ext_feature_metadata
 * @returns attribute's type
 */
const getAttributeTypeFromExtFeatureMetadata = (
  property: GLTF_EXT_feature_metadata_ClassProperty
): AttributeProperty => {
  let attributeType: string;
  switch (property.type) {
    case 'INT8':
    case 'UINT8':
    case 'INT16':
    case 'UINT16':
    case 'INT32':
    case 'UINT32':
      attributeType = SHORT_INT_TYPE;
      break;

    case 'FLOAT32':
    case 'FLOAT64':
      attributeType = DOUBLE_TYPE;
      break;

    case 'INT64':
    case 'UINT64':
    case 'BOOLEAN':
    case 'ENUM':
    case 'STRING':
    case 'ARRAY':
      attributeType = STRING_TYPE;
      break;

    default:
      attributeType = STRING_TYPE;
      break;
  }
  const attributeProperty: AttributeProperty = {
    attributeType: attributeType,
    attributeName: property.name,
    attributeDescription: property.description
  };
  return attributeProperty;
};

/**
 * Gets the attribute type for attributeStorageInfo according to the extension class schema
 * @see https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param property - schema of the class property for Ext_structural_metadata
 * @returns attribute's type
 */
const getAttributeTypeFromExtStructuralMetadata = (
  property: GLTF_EXT_structural_metadata_ClassProperty
): AttributeProperty => {
  let attributeType: string;
  attributeType = '';
  if (property.array) {
    attributeType = STRING_TYPE;
  } else {
    switch (property.componentType) {
      case 'INT8':
      case 'UINT8':
      case 'INT16':
      case 'UINT16':
      case 'INT32':
      case 'UINT32':
        attributeType = SHORT_INT_TYPE;
        break;

      case 'FLOAT32':
      case 'FLOAT64':
        attributeType = DOUBLE_TYPE;
        break;

      case 'INT64':
      case 'UINT64':
        attributeType = STRING_TYPE;
        break;

      default:
        attributeType = STRING_TYPE;
        break;
    }
  }
  const attributeProperty: AttributeProperty = {
    attributeType: attributeType,
    attributeName: property.name,
    attributeDescription: property.description
  };
  return attributeProperty;
};

/**
 * Creates Attribute Storage Info objects based on attribute's types
 * @param attributePropertySet - set of attribute's types
 * @param attributeStorageInfo - array where Attribute Storage Info objects are being stored
 * @param fields - array where attribute fields are being stored
 * @returns PopupInfo object
 */
export function createStorageAttributes(
  attributePropertySet: AttributePropertySet,
  attributeStorageInfo: AttributeStorageInfo[] | undefined,
  fields: Field[] | undefined
): PopupInfo {
  const attributesWithObjectId: AttributePropertySet = {
    OBJECTID: {attributeType: OBJECT_ID_TYPE},
    ...attributePropertySet
  };

  let attributeIndex = 0;
  for (const key in attributesWithObjectId) {
    const attributeProperty = attributesWithObjectId[key];
    const attributeType = attributeProperty.attributeType;

    const storageAttribute: AttributeStorageInfo = createdStorageAttribute(
      attributeIndex,
      key,
      attributeType
    );
    const fieldAttributeType = getFieldAttributeType(attributeType);
    const fieldAttribute = createFieldAttribute(key, fieldAttributeType);

    attributeStorageInfo!.push(storageAttribute);
    fields!.push(fieldAttribute);
    attributeIndex += 1;
  }
  const popupInfo = createPopupInfo(Object.keys(attributesWithObjectId));
  return popupInfo;
}
