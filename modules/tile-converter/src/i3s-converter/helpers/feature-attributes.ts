import {SchemaClassProperty} from '../types';
import type {FeatureTableJson} from '@loaders.gl/3d-tiles';
import {
  Attribute,
  AttributeStorageInfo,
  ESRIField,
  Field,
  FieldInfo,
  PopupInfo
} from '@loaders.gl/i3s';

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
export function getAttributeType(key: string, attribute: unknown): string {
  if (key === OBJECT_ID_TYPE) {
    return OBJECT_ID_TYPE;
  }
  if (typeof attribute === STRING_TYPE || typeof attribute === 'bigint') {
    return STRING_TYPE;
  } else if (typeof attribute === 'number') {
    return Number.isInteger(attribute) ? SHORT_INT_TYPE : DOUBLE_TYPE;
  }
  return STRING_TYPE;
}

/**
 * Get the attribute type for attributeStorageInfo according to the schema
 * @see https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param {SchemaClassProperty} schema - attribute's schema
 * @returns attribute's type
 */
export function getAttributeTypeBasedOnSchema(schema: SchemaClassProperty): string {
  if (
    schema.array ||
    schema.propertyType === STRING_TYPE ||
    schema.propertyType === 'INT64' ||
    schema.propertyType === 'UINT64'
  ) {
    return STRING_TYPE;
  } else if (schema.propertyType === 'FLOAT32' || schema.propertyType === 'FLOAT64') {
    return DOUBLE_TYPE;
  } else {
    return SHORT_INT_TYPE;
  }
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
 * @param propertyNames - array of property name including OBJECTID.
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
