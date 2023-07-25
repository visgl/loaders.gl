/* eslint-disable camelcase */
import type {GLTF, GLTFTextureInfoMetadata, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {
  GLTF_EXT_structural_metadata_Schema,
  GLTF_EXT_structural_metadata_ClassProperty,
  GLTF_EXT_structural_metadata_Enum,
  GLTF_EXT_structural_metadata_EnumValue,
  GLTF_EXT_structural_metadata_PropertyTable,
  GLTF_EXT_structural_metadata,
  GLTF_EXT_structural_metadata_PropertyTexture,
  GLTF_EXT_structural_metadata_PropertyTable_Property
} from '../types/gltf-ext-structural-metadata-schema';

import {EXTENSION_NAME_EXT_STRUCTURAL_METADATA} from '../types/gltf-ext-structural-metadata-schema';
import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {
  getPrimitiveTextureData,
  primitivePropertyDataToAttributes
} from '../gltf-utils/gltf-texture-storage';

export const name = EXTENSION_NAME_EXT_STRUCTURAL_METADATA;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtStructuralMetadata(scenegraph);
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph
 */
function decodeExtStructuralMetadata(scenegraph: GLTFScenegraph): void {
  const extension: GLTF_EXT_structural_metadata | null = scenegraph.getExtension(
    EXTENSION_NAME_EXT_STRUCTURAL_METADATA
  );
  if (!extension) return;

  const schemaClasses = extension?.schema?.classes;
  const propertyTables = extension?.propertyTables;
  const propertyTextures = extension?.propertyTextures;

  // Iterate through all meshes/primitives.
  const json = scenegraph.gltf.json;
  if (!json.meshes) {
    return;
  }
  if (propertyTextures) {
    for (const mesh of json.meshes) {
      for (const primitive of mesh.primitives) {
        processPrimitivePropertyTextures(scenegraph, propertyTextures, primitive, extension);
      }
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
  propertyTextures: GLTF_EXT_structural_metadata_PropertyTexture[] | undefined,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_structural_metadata // top-level extension
): void {
  if (!propertyTextures) return;
  const primitivePropertyTextureIndices =
    primitive.extensions?.[EXTENSION_NAME_EXT_STRUCTURAL_METADATA]?.propertyTextures;
  if (!primitivePropertyTextureIndices) return;

  for (const primitivePropertyTextureIndex of primitivePropertyTextureIndices) {
    const propertyTexture = propertyTextures[primitivePropertyTextureIndex];
    processPropertyTexture(scenegraph, propertyTexture, primitive, extension);
  }
}

// eslint-disable-next-line max-statements
function processPropertyTexture(
  scenegraph: GLTFScenegraph,
  propertyTexture: GLTF_EXT_structural_metadata_PropertyTexture, // propertyTexture definition taken from the top-level extension
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_structural_metadata // top-level extension
): void {
  if (!propertyTexture.properties) return;

  // The data taken from all meshes/primitives (the same property, e.g. "speed" or "direction") will be combined into one array and saved in textureInfoTopLevel.data
  // Initially textureInfoTopLevel.data will be initialized with an empty array.
  if (!extension.data) {
    extension.data = [];
  }
  const featureTextureTable: number[] = extension.data;
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
    // propName has values like "speed", "direction"
    // Make attrinuteName as a combination of the class name and the propertyName like "wind_speed" or "wind_direction"
    const attributeName = `${className}_${propName}`;
    const textureInfoTopLevel: GLTFTextureInfoMetadata | undefined =
      propertyTexture.properties?.[propName];
    if (!textureInfoTopLevel) return;

    const propertyData: any[] | null = getPrimitiveTextureData(
      scenegraph,
      textureInfoTopLevel,
      undefined,
      primitive
    );
    if (propertyData === null) return;
    primitivePropertyDataToAttributes(
      scenegraph,
      attributeName,
      propertyData,
      featureTextureTable,
      primitive
    );
  }
  extension.data = featureTextureTable;
}

/**
 * Navigate throw all properies in feature table and gets properties data.
 * @param scenegraph
 * @param featureTable
 * @param schemaClass
 */
function handlePropertyTableProperties(
  scenegraph: GLTFScenegraph,
  propertyTable: GLTF_EXT_structural_metadata_PropertyTable, // propertyTable definition taken from the top-level extension
  schema: GLTF_EXT_structural_metadata_Schema
): void {
  const schemaClass = schema.classes?.[propertyTable.class];
  if (!schemaClass) return;

  propertyTable.data = [];
  const numberOfProperties = propertyTable.count;

  for (const propertyName in schemaClass.properties) {
    const schemaProperty = schemaClass.properties[propertyName];
    const propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property | undefined =
      propertyTable?.properties?.[propertyName];

    if (propertyTableProperty) {
      const data = getPropertyDataFromBinarySource(
        scenegraph,
        schema,
        schemaProperty,
        numberOfProperties,
        propertyTableProperty
      );
      propertyTableProperty.data = data;
    }
  }

  for (let i = 0; i < numberOfProperties; i++) {
    const data: (number[] | string[])[] = [];
    for (const propertyName in schemaClass.properties) {
      const propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property | undefined =
        propertyTable?.properties?.[propertyName];

      if (propertyTableProperty) {
        const d = propertyTableProperty.data?.[i] as number[] | string[];
        data.push(d);
      }
    }
    propertyTable.data.push(data);
  }
}

/**
 * Decode properties from binary sourse based on property type.
 * @param scenegraph
 * @param schemaProperty
 * @param numberOfProperties
 * @param propertyTableProperty
 */
function getPropertyDataFromBinarySource(
  scenegraph: GLTFScenegraph,
  schema: GLTF_EXT_structural_metadata_Schema,
  schemaProperty: GLTF_EXT_structural_metadata_ClassProperty,
  numberOfProperties: number,
  propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property
): string[] | number[] {
  const bufferView = propertyTableProperty.values;
  // TODO think maybe we shouldn't get data only in Uint8Array format.
  const valuesData: Uint8Array = scenegraph.getTypedArrayForBufferView(bufferView);
  let data: string[] | number[] = [];

  switch (schemaProperty.type) {
    case 'STRING': {
      // stringOffsets should be available for string type.
      const stringOffsetBufferView = propertyTableProperty.stringOffsets!;
      const offsetsData = scenegraph.getTypedArrayForBufferView(stringOffsetBufferView);
      data = getStringAttributes(valuesData, offsetsData, numberOfProperties);
      break;
    }
    case 'ENUM': {
      let offsetsData;
      if (propertyTableProperty.arrayOffsets) {
        const arrayOffsetBufferView = propertyTableProperty.arrayOffsets;
        offsetsData = scenegraph.getTypedArrayForBufferView(arrayOffsetBufferView);
      }
      data = getEnumAttributes(valuesData, schema, schemaProperty, offsetsData, numberOfProperties);
      break;
    }
    case 'SCALAR': {
      let offsetsData;
      if (propertyTableProperty.arrayOffsets) {
        const arrayOffsetBufferView = propertyTableProperty.arrayOffsets;
        offsetsData = scenegraph.getTypedArrayForBufferView(arrayOffsetBufferView);
      }
      data = getScalarAttributes(
        valuesData,
        schema,
        schemaProperty,
        offsetsData,
        numberOfProperties
      );
      break;
    }
    default:
  }

  return data;
}

/**
 * Find the property table by class name.
 * @param propertyTables
 * @param schemaClassName
 */
function findPropertyTableByClass(
  propertyTables: GLTF_EXT_structural_metadata_PropertyTable[],
  schemaClassName: string
): GLTF_EXT_structural_metadata_PropertyTable | null {
  for (let i = 0, len = propertyTables.length; i < len; i++) {
    const propertyTable = propertyTables[i];

    if (propertyTable.class === schemaClassName) {
      return propertyTable;
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
  for (let index = 0; index < stringsCount; index++) {
    const stringByteSize = offsetsData[index + 1] - offsetsData[index];

    if (stringByteSize + stringOffset > data.length) {
      //      console.log(`Incorrect string offset: ${stringOffset}, ${stringByteSize}`);
      continue;
    }
    const stringData = data.subarray(stringOffset, stringByteSize + stringOffset);
    const stringAttribute = textDecoder.decode(stringData);

    stringsArray.push(stringAttribute);
    stringOffset += stringByteSize;
  }

  return stringsArray;
}

function getEnumAttributes(
  valuesData: Uint8Array,
  schema: GLTF_EXT_structural_metadata_Schema,
  schemaProperty: GLTF_EXT_structural_metadata_ClassProperty,
  offsetsData: Uint8Array | undefined,
  numberOfAttributeValues: number
): string[] {
  const attributeValueArray: string[] = [];

  const enumType = schemaProperty.enumType;
  if (!enumType) return [];

  const enumEntry: GLTF_EXT_structural_metadata_Enum | undefined = schema.enums?.[enumType];
  if (!enumEntry) return [];

  for (let index = 0; index < numberOfAttributeValues; index++) {
    const valuesIndex = offsetsData?.[index] || 0;
    const valueOfEnum = valuesData[valuesIndex];
    const enumValue = getEnumByValue(enumEntry, valueOfEnum);
    // TODO: Is the name or the value of the Enum expected to be used here?
    if (enumValue) {
      attributeValueArray.push(enumValue.name);
    }
  }

  return attributeValueArray;
}

function getEnumByValue(
  enumEntry: GLTF_EXT_structural_metadata_Enum,
  value: number
): GLTF_EXT_structural_metadata_EnumValue | null {
  for (const enumValue of enumEntry.values) {
    if (enumValue.value === value) {
      return enumValue;
    }
  }

  return null;
}

function getScalarAttributes(
  valuesData: Uint8Array,
  schema: GLTF_EXT_structural_metadata_Schema,
  schemaProperty: GLTF_EXT_structural_metadata_ClassProperty,
  offsetsData: Uint8Array | undefined,
  numberOfAttributeValues: number
): number[] {
  const attributeValueArray: number[] = [];

  for (let index = 0; index < numberOfAttributeValues; index++) {
    const valuesIndex = offsetsData?.[index] || 0;
    const value = valuesData[valuesIndex];
    attributeValueArray.push(value);
  }
  return attributeValueArray;
}

export function getPropertyTable(
  scenegraph: GLTFScenegraph,
  propertyTableIndex: number
): GLTF_EXT_structural_metadata_PropertyTable | null {
  const extensionStructuralMetadata: GLTF_EXT_structural_metadata | null = scenegraph.getExtension(
    EXTENSION_NAME_EXT_STRUCTURAL_METADATA
  );
  if (!extensionStructuralMetadata) return null;
  if (!extensionStructuralMetadata.propertyTables || !extensionStructuralMetadata.schema)
    return null;

  const propertyTable: GLTF_EXT_structural_metadata_PropertyTable =
    extensionStructuralMetadata.propertyTables[propertyTableIndex];
  const schemaClass = extensionStructuralMetadata?.schema?.classes?.[propertyTable.class];
  if (propertyTable && schemaClass) {
    handlePropertyTableProperties(scenegraph, propertyTable, extensionStructuralMetadata.schema);
    return propertyTable;
  }
  return null;
}
