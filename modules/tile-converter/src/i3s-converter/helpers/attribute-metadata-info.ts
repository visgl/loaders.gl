import type {
  Attribute,
  AttributeStorageInfo,
  ESRIField,
  Field,
  FieldInfo,
  PopupInfo
} from '@loaders.gl/i3s';

import {AttributeType} from '../types';

export type AttributeMetadataInfoObject = {
  attributeStorageInfo: AttributeStorageInfo[];
  fields: Field[];
  popupInfo: PopupInfo | undefined;
};

export class AttributeMetadataInfo {
  private _attributeStorageInfo: AttributeStorageInfo[];
  private _fields: Field[];
  private _popupInfo: PopupInfo | undefined;

  constructor() {
    this._attributeStorageInfo = [];
    this._fields = [];
  }

  get attributeStorageInfo(): AttributeStorageInfo[] {
    return this._attributeStorageInfo;
  }

  get fields(): Field[] {
    return this._fields;
  }

  get popupInfo(): PopupInfo | undefined {
    return this._popupInfo;
  }

  /**
   * Creates and stores Attribute Storage Info, Fields and PopupInfo objects based on attribute's types.
   * Appends objects that have not been stored yet.
   * @param attributeTypesMap - set of attribute's types
   * @example AttributeStorageInfo, Fields and PopupInfo already contain objects for the following attributes:
   * {
   *   color: 'string',
   *   name: 'string',
   *   opt_uint8: 'Int32'
   * }
   * Then, we call the addMetadataInfo method with the following attributeTypesMap:
   * {
   *   // The same attributes
   *   color: 'string',
   *   name: 'string',
   *   opt_uint8: 'Int32',
   *   // New attributes
   *   opt_uint64: 'string',
   *   opt_float32: 'double',
   * }
   * The method creates and stores objects for opt_uint64, opt_float32 attributes.
   */
  addMetadataInfo(attributeTypesMap: Record<string, Attribute>): void {
    if (!Object.keys(attributeTypesMap).length) {
      return;
    }
    const attributeTypes: Record<string, Attribute> = {
      OBJECTID: AttributeType.OBJECT_ID_TYPE,
      ...attributeTypesMap
    };

    let isUpdated = false;
    let attributeIndex = this._attributeStorageInfo.length;
    for (const key in attributeTypes) {
      /*
      We will append a new attribute only in case it has not been added to the attribute storage info yet.
      */
      const elementFound = this._attributeStorageInfo.find((element) => element.name === key);
      if (!elementFound) {
        const attributeType = attributeTypes[key];

        const storageAttribute = this.createStorageAttribute(attributeIndex, key, attributeType);
        const fieldAttributeType = this.getFieldAttributeType(attributeType);
        const fieldAttribute = this.createFieldAttribute(key, fieldAttributeType);

        this._attributeStorageInfo.push(storageAttribute);
        this._fields.push(fieldAttribute);
        attributeIndex += 1;
        isUpdated = true;
      }
    }
    if (isUpdated) {
      /*
      The attributeStorageInfo is updated. So, popupInfo should be recreated.
      Use attributeStorageInfo as a source of attribute names to create the popupInfo.
      */
      const attributeNames: string[] = [];
      for (let info of this._attributeStorageInfo) {
        attributeNames.push(info.name);
      }
      this._popupInfo = this.createPopupInfo(attributeNames);
    }
  }

  /**
   * Set AttributeMetadataInfo from object
   * @param object - object with AttributeMetadataInfo props
   */
  fromObject(object: AttributeMetadataInfoObject) {
    this._attributeStorageInfo = object.attributeStorageInfo;
    this._fields = object.fields;
    this._popupInfo = object.popupInfo;
  }

  /**
   * Generates storage attribute for map segmentation.
   * @param attributeIndex - order index of attribute (f_0, f_1 ...).
   * @param key - attribute key from propertyTable.
   * @param attributeType - attribute type.
   * @return Updated storageAttribute.
   */
  private createStorageAttribute(
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
      case AttributeType.OBJECT_ID_TYPE:
        this.setupIdAttribute(storageAttribute);
        break;
      case AttributeType.STRING_TYPE:
        this.setupStringAttribute(storageAttribute);
        break;
      case AttributeType.DOUBLE_TYPE:
        this.setupDoubleAttribute(storageAttribute);
        break;
      case AttributeType.SHORT_INT_TYPE:
        break;
      default:
        this.setupStringAttribute(storageAttribute);
    }

    return storageAttribute;
  }

  /**
   * Finds and returns attribute type based on key form propertyTable.
   * @param attributeType
   */
  private getFieldAttributeType(attributeType: Attribute): ESRIField {
    switch (attributeType) {
      case AttributeType.OBJECT_ID_TYPE:
        return 'esriFieldTypeOID';
      case AttributeType.STRING_TYPE:
        return 'esriFieldTypeString';
      case AttributeType.SHORT_INT_TYPE:
        return 'esriFieldTypeInteger';
      case AttributeType.DOUBLE_TYPE:
        return 'esriFieldTypeDouble';
      default:
        return 'esriFieldTypeString';
    }
  }

  /**
   * Sets up Id attribute for map segmentation.
   * @param storageAttribute - attribute for map segmentation .
   */
  private setupIdAttribute(storageAttribute: AttributeStorageInfo): void {
    storageAttribute.attributeValues = {
      valueType: 'Oid32',
      valuesPerElement: 1
    };
  }

  /**
   * Sets up storage attribute as string.
   * @param storageAttribute - attribute for map segmentation.
   */
  private setupStringAttribute(storageAttribute: AttributeStorageInfo): void {
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
   * Sets up double attribute for map segmentation.
   * @param storageAttribute - attribute for map segmentation .
   */
  private setupDoubleAttribute(storageAttribute: AttributeStorageInfo): void {
    storageAttribute.attributeValues = {
      valueType: 'Float64',
      valuesPerElement: 1
    };
  }

  /**
   * Sets up field attribute for map segmentation.
   * @param key - attribute for map segmentation.
   * @param fieldAttributeType - esri attribute type ('esriFieldTypeString' or 'esriFieldTypeOID').
   */
  private createFieldAttribute(key: string, fieldAttributeType: ESRIField): Field {
    return {
      name: key,
      type: fieldAttributeType,
      alias: key
    };
  }

  /**
   * Generates popup info to show metadata on the map.
   * @param propertyNames - array of property names including OBJECTID.
   * @return data for correct rendering of popup.
   */
  private createPopupInfo(propertyNames: string[]): PopupInfo {
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
}
