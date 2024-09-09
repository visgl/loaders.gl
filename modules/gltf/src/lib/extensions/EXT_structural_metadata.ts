// GLTF EXTENSION: EXT_structural_metadata
// https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata
/* eslint-disable camelcase */
import type {BigTypedArray, TypedArray} from '@loaders.gl/schema';
import type {GLTF, GLTFTextureInfoMetadata, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {
  GLTF_EXT_structural_metadata_Schema,
  GLTF_EXT_structural_metadata_ClassProperty,
  GLTF_EXT_structural_metadata_Enum,
  GLTF_EXT_structural_metadata_EnumValue,
  GLTF_EXT_structural_metadata_PropertyTable,
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_PropertyTexture,
  GLTF_EXT_structural_metadata_PropertyTable_Property,
  GLTF_EXT_structural_metadata_Primitive,
  GLTF_EXT_structural_metadata_Class
} from '../types/gltf-ext-structural-metadata-schema';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import {GLTFWriterOptions} from '../../gltf-writer';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {
  convertRawBufferToMetadataArray,
  getPrimitiveTextureData,
  primitivePropertyDataToAttributes,
  getArrayElementByteSize,
  NumericComponentType,
  getOffsetsForProperty,
  parseVariableLengthArrayNumeric,
  parseFixedLengthArrayNumeric,
  getPropertyDataString
} from './utils/3d-tiles-utils';

const EXT_STRUCTURAL_METADATA_NAME = 'EXT_structural_metadata';
export const name = EXT_STRUCTURAL_METADATA_NAME;

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtStructuralMetadata(scenegraph, options);
}

export function encode(gltfData: {json: GLTF}, options: GLTFWriterOptions) {
  const scenegraph = new GLTFScenegraph(gltfData);
  encodeExtStructuralMetadata(scenegraph, options);
  scenegraph.createBinaryChunk();
  return scenegraph.gltf;
}

/*
// Example of the extension.
// See more info at https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata
const extensions = {
  "extensions": {
    "EXT_structural_metadata": {
      "schema": {
        "classes": {
          "tree": {
            "name": "Tree",
            "description": "Woody, perennial plant.",
            "properties": {
              "species": {
                "description": "Type of tree.",
                "type": "ENUM",
                "enumType": "speciesEnum",
                "required": true
              },
              "age": {
                "description": "The age of the tree, in years",
                "type": "SCALAR",
                "componentType": "UINT8",
                "required": true
              }
            }
          }
        },
        "enums": {
          "speciesEnum": {
            "name": "Species",
            "description": "An example enum for tree species.",
            // valueType is not defined here. Default is "UINT16"
            "values": [
              { "name": "Unspecified", "value": 0 },
              { "name": "Oak", "value": 1 }
            ]
          }
        }
      },
      "propertyTables": [{
        "name": "tree_survey_2021-09-29",
        "class": "tree",
        "count": 10,  // The number of elements in each property array (in `species`, in `age`).
        "properties": {
          "species": {
            "values": 0, // It's an index of the buffer view containing property values.
          },
          "age": {
            "values": 1
          }
        }
      }]
    }
  }
}
*/

/**
 * Decodes feature metadata from extension.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param options - GLTFLoader options.
 */
function decodeExtStructuralMetadata(scenegraph: GLTFScenegraph, options: GLTFLoaderOptions): void {
  // Decoding metadata involves buffers processing.
  // So, if buffers have not been loaded, there is no reason to process metadata.
  if (!options.gltf?.loadBuffers) {
    return;
  }
  const extension: GLTF_EXT_structural_metadata_GLTF | null = scenegraph.getExtension(
    EXT_STRUCTURAL_METADATA_NAME
  );
  if (!extension) {
    return;
  }

  if (options.gltf?.loadImages) {
    decodePropertyTextures(scenegraph, extension);
  }

  decodePropertyTables(scenegraph, extension);
}

/**
 * Processes the data stored in the textures
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param extension - Top-level extension.
 */
function decodePropertyTextures(
  scenegraph: GLTFScenegraph,
  extension: GLTF_EXT_structural_metadata_GLTF
): void {
  const propertyTextures = extension.propertyTextures;
  const json = scenegraph.gltf.json;
  if (propertyTextures && json.meshes) {
    // Iterate through all meshes/primitives.
    for (const mesh of json.meshes) {
      for (const primitive of mesh.primitives) {
        processPrimitivePropertyTextures(scenegraph, propertyTextures, primitive, extension);
      }
    }
  }
}

/**
 * Processes the data stored in the property tables.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param extension - Top-level extension.
 */
function decodePropertyTables(
  scenegraph: GLTFScenegraph,
  extension: GLTF_EXT_structural_metadata_GLTF
): void {
  const schema = extension.schema;
  if (!schema) {
    return;
  }
  const schemaClasses = schema.classes;
  const propertyTables = extension.propertyTables;
  if (schemaClasses && propertyTables) {
    for (const schemaName in schemaClasses) {
      const propertyTable = findPropertyTableByClass(propertyTables, schemaName);
      if (propertyTable) {
        processPropertyTable(scenegraph, schema, propertyTable);
      }
    }
  }
}

/**
 * Finds the property table by class name.
 * @param propertyTables - propertyTable definition taken from the top-level extension.
 * @param schemaClassName - class name in the extension schema.
 */
function findPropertyTableByClass(
  propertyTables: GLTF_EXT_structural_metadata_PropertyTable[],
  schemaClassName: string
): GLTF_EXT_structural_metadata_PropertyTable | null {
  for (const propertyTable of propertyTables) {
    if (propertyTable.class === schemaClassName) {
      return propertyTable;
    }
  }

  return null;
}

/**
 * Takes data from property textures reffered by the primitive.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyTextures - propertyTexture definition taken from the top-level extention.
 * @param primitive - Primitive object.
 * @param extension - Top-level extension.
 */
function processPrimitivePropertyTextures(
  scenegraph: GLTFScenegraph,
  propertyTextures: GLTF_EXT_structural_metadata_PropertyTexture[],
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_structural_metadata_GLTF
): void {
  if (!propertyTextures) {
    return;
  }
  const primitiveExtension: GLTF_EXT_structural_metadata_Primitive = primitive.extensions?.[
    EXT_STRUCTURAL_METADATA_NAME
  ] as GLTF_EXT_structural_metadata_Primitive;
  const primitivePropertyTextureIndices = primitiveExtension?.propertyTextures;
  if (!primitivePropertyTextureIndices) {
    return;
  }

  for (const primitivePropertyTextureIndex of primitivePropertyTextureIndices) {
    const propertyTexture = propertyTextures[primitivePropertyTextureIndex];
    processPrimitivePropertyTexture(scenegraph, propertyTexture, primitive, extension);
  }
}

/**
 * Takes property data from the texture pointed by the primitive and appends them to `exension.data`.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyTexture - propertyTexture definition taken from the top-level extension.
 * @param primitive - Primitive object.
 * @param extension - Top-level extension.
 */
function processPrimitivePropertyTexture(
  scenegraph: GLTFScenegraph,
  propertyTexture: GLTF_EXT_structural_metadata_PropertyTexture,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_structural_metadata_GLTF
): void {
  if (!propertyTexture.properties) {
    return;
  }

  if (!extension.dataAttributeNames) {
    extension.dataAttributeNames = [];
  }

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
  for (const propertyName in propertyTexture.properties) {
    // propertyName has values like "speed", "direction"
    // Make attributeName as a combination of the class name and the propertyName like "wind_speed" or "wind_direction"
    const attributeName = `${className}_${propertyName}`;
    const textureInfoTopLevel: GLTFTextureInfoMetadata | undefined =
      propertyTexture.properties?.[propertyName];
    if (!textureInfoTopLevel) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // The data taken from all meshes/primitives (the same property, e.g. "speed" or "direction") will be combined into one array and saved in textureInfoTopLevel.data
    // Initially textureInfoTopLevel.data will be initialized with an empty array.
    if (!textureInfoTopLevel.data) {
      textureInfoTopLevel.data = [];
    }
    const featureTextureTable: number[] = textureInfoTopLevel.data as number[];

    const propertyData: number[] | null = getPrimitiveTextureData(
      scenegraph,
      textureInfoTopLevel,
      primitive
    );
    if (propertyData === null) {
      // eslint-disable-next-line no-continue
      continue;
    }
    primitivePropertyDataToAttributes(
      scenegraph,
      attributeName,
      propertyData,
      featureTextureTable,
      primitive
    );
    textureInfoTopLevel.data = featureTextureTable;
    extension.dataAttributeNames.push(attributeName);
  }
}

/**
 * Navigates through all properies in the property table, gets properties data,
 * and put the data to `propertyTable.data` as an array.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param schema - schema object.
 * @param propertyTable - propertyTable definition taken from the top-level extension.
 */
function processPropertyTable(
  scenegraph: GLTFScenegraph,
  schema: GLTF_EXT_structural_metadata_Schema,
  propertyTable: GLTF_EXT_structural_metadata_PropertyTable
): void {
  const schemaClass = schema.classes?.[propertyTable.class];
  if (!schemaClass) {
    throw new Error(
      `Incorrect data in the EXT_structural_metadata extension: no schema class with name ${propertyTable.class}`
    );
  }

  const numberOfElements = propertyTable.count; // `propertyTable.count` is a number of elements in each property array.

  for (const propertyName in schemaClass.properties) {
    const classProperty = schemaClass.properties[propertyName];
    const propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property | undefined =
      propertyTable.properties?.[propertyName];

    if (propertyTableProperty) {
      // Getting all elements (`numberOfElements`) of the array in the `propertyTableProperty`
      const data = getPropertyDataFromBinarySource(
        scenegraph,
        schema,
        classProperty,
        numberOfElements,
        propertyTableProperty
      );
      propertyTableProperty.data = data;
    }
  }
}

/**
 * Decodes a propertyTable column from binary source based on property type.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param schema - Schema object.
 * @param classProperty - class property object.
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param propertyTableProperty - propertyTable's property metadata.
 * @returns {string[] | number[] | string[][] | number[][]}
 */
function getPropertyDataFromBinarySource(
  scenegraph: GLTFScenegraph,
  schema: GLTF_EXT_structural_metadata_Schema,
  classProperty: GLTF_EXT_structural_metadata_ClassProperty,
  numberOfElements: number,
  propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property
): string[] | BigTypedArray | string[][] | BigTypedArray[] {
  let data: string[] | BigTypedArray | string[][] | BigTypedArray[] = [];
  const valuesBufferView = propertyTableProperty.values;
  const valuesDataBytes: Uint8Array = scenegraph.getTypedArrayForBufferView(valuesBufferView);

  const arrayOffsets = getArrayOffsetsForProperty(
    scenegraph,
    classProperty,
    propertyTableProperty,
    numberOfElements
  );
  const stringOffsets = getStringOffsetsForProperty(
    scenegraph,
    propertyTableProperty,
    numberOfElements
  );

  switch (classProperty.type) {
    case 'SCALAR':
    case 'VEC2':
    case 'VEC3':
    case 'VEC4':
    case 'MAT2':
    case 'MAT3':
    case 'MAT4': {
      data = getPropertyDataNumeric(classProperty, numberOfElements, valuesDataBytes, arrayOffsets);
      break;
    }
    case 'BOOLEAN': {
      // TODO: implement it as soon as we have the corresponding tileset
      throw new Error(`Not implemented - classProperty.type=${classProperty.type}`);
    }
    case 'STRING': {
      data = getPropertyDataString(numberOfElements, valuesDataBytes, arrayOffsets, stringOffsets);
      break;
    }
    case 'ENUM': {
      data = getPropertyDataENUM(
        schema,
        classProperty,
        numberOfElements,
        valuesDataBytes,
        arrayOffsets
      );
      break;
    }
    default:
      throw new Error(`Unknown classProperty type ${classProperty.type}`);
  }

  return data;
}

/**
 * Parses propertyTable.property.arrayOffsets that are offsets of sub-arrays in a flatten array of values.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param classProperty - class property object.
 * @param propertyTableProperty - propertyTable's property metadata.
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @returns Typed array with offset values.
 * @see https://github.com/CesiumGS/glTF/blob/2976f1183343a47a29e4059a70961371cd2fcee8/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTable.property.schema.json#L21
 */
function getArrayOffsetsForProperty(
  scenegraph: GLTFScenegraph,
  classProperty: GLTF_EXT_structural_metadata_ClassProperty,
  propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property,
  numberOfElements: number
): TypedArray | null {
  if (
    classProperty.array &&
    // `count` is a number of array elements. May only be defined when `array` is true.
    // If `count` is NOT defined, it's a VARIABLE-length array
    typeof classProperty.count === 'undefined' &&
    // `arrayOffsets` is an index of the buffer view containing offsets for variable-length arrays.
    typeof propertyTableProperty.arrayOffsets !== 'undefined'
  ) {
    // Data are in a VARIABLE-length array
    return getOffsetsForProperty(
      scenegraph,
      propertyTableProperty.arrayOffsets,
      propertyTableProperty.arrayOffsetType || 'UINT32',
      numberOfElements
    );
  }
  return null;
}

/**
 * Parses propertyTable.property.stringOffsets.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyTableProperty - propertyTable's property metadata.
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @returns Typed array with offset values.
 * @see https://github.com/CesiumGS/glTF/blob/2976f1183343a47a29e4059a70961371cd2fcee8/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTable.property.schema.json#L29C10-L29C23
 */
function getStringOffsetsForProperty(
  scenegraph: GLTFScenegraph,
  propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property,
  numberOfElements: number
): TypedArray | null {
  if (
    typeof propertyTableProperty.stringOffsets !== 'undefined' // `stringOffsets` is an index of the buffer view containing offsets for strings.
  ) {
    // Data are in a FIXED-length array
    return getOffsetsForProperty(
      scenegraph,
      propertyTableProperty.stringOffsets,
      propertyTableProperty.stringOffsetType || 'UINT32',
      numberOfElements
    );
  }
  return null;
}

/**
 * Decodes properties of SCALAR, VEC-N, MAT-N types from binary sourse.
 * @param classProperty - class property object.
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param valuesDataBytes - Data taken from values property of the property table property.
 * @param arrayOffsets - Offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @returns Property values in a typed array or in an array of typed arrays.
 */
function getPropertyDataNumeric(
  classProperty: GLTF_EXT_structural_metadata_ClassProperty,
  numberOfElements: number,
  valuesDataBytes: Uint8Array,
  arrayOffsets: TypedArray | null
): BigTypedArray | BigTypedArray[] {
  const isArray = classProperty.array;
  const arrayCount = classProperty.count;

  const elementSize = getArrayElementByteSize(classProperty.type, classProperty.componentType);
  const elementCount = valuesDataBytes.byteLength / elementSize;

  let valuesData: BigTypedArray;
  if (classProperty.componentType) {
    valuesData = convertRawBufferToMetadataArray(
      valuesDataBytes,
      classProperty.type,
      // The datatype of the element's components. Only applicable to `SCALAR`, `VECN`, and `MATN` types.
      classProperty.componentType as NumericComponentType,
      elementCount
    );
  } else {
    // The spec doesn't provide any info what to do if componentType is not set.
    valuesData = valuesDataBytes;
  }

  if (isArray) {
    if (arrayOffsets) {
      // VARIABLE-length array
      return parseVariableLengthArrayNumeric(
        valuesData,
        numberOfElements,
        arrayOffsets,
        valuesDataBytes.length,
        elementSize
      );
    }
    if (arrayCount) {
      // FIXED-length array
      return parseFixedLengthArrayNumeric(valuesData, numberOfElements, arrayCount);
    }
    return [];
  }

  return valuesData;
}

/**
 * Decodes properties of enum type from binary source.
 * @param schema - Schema object.
 * @param classProperty - Class property object.
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param valuesDataBytes - Data taken from values property of the property table property.
 * @param arrayOffsets - Offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @returns Strings array of nested strings array.
 */
function getPropertyDataENUM(
  schema: GLTF_EXT_structural_metadata_Schema,
  classProperty: GLTF_EXT_structural_metadata_ClassProperty,
  numberOfElements: number,
  valuesDataBytes: Uint8Array,
  arrayOffsets: TypedArray | null
): string[] | string[][] {
  const enumType = classProperty.enumType;
  // Enum ID as declared in the `enums` dictionary. Required when `type` is `ENUM`.
  if (!enumType) {
    throw new Error(
      'Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM'
    );
  }

  const enumEntry: GLTF_EXT_structural_metadata_Enum | undefined = schema.enums?.[enumType];
  if (!enumEntry) {
    throw new Error(
      `Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${enumType}`
    );
  }

  const enumValueType = enumEntry.valueType || 'UINT16';
  const elementSize = getArrayElementByteSize(classProperty.type, enumValueType);
  const elementCount = valuesDataBytes.byteLength / elementSize;
  let valuesData: BigTypedArray | null = convertRawBufferToMetadataArray(
    valuesDataBytes,
    classProperty.type,
    enumValueType,
    elementCount
  );
  if (!valuesData) {
    valuesData = valuesDataBytes;
  }

  if (classProperty.array) {
    if (arrayOffsets) {
      // VARIABLE-length array
      return parseVariableLengthArrayENUM({
        valuesData,
        numberOfElements,
        arrayOffsets,
        valuesDataBytesLength: valuesDataBytes.length,
        elementSize,
        enumEntry
      });
    }

    const arrayCount = classProperty.count;
    if (arrayCount) {
      // FIXED-length array
      return parseFixedLengthArrayENUM(valuesData, numberOfElements, arrayCount, enumEntry);
    }
    return [];
  }

  // Single value (not an array)
  return getEnumsArray(valuesData, 0, numberOfElements, enumEntry);
}

/**
 * Parses variable length nested ENUM arrays.
 * @param params.valuesData - Values in a flat typed array.
 * @param params.numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param params.arrayOffsets - Offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @param params.valuesDataBytesLength - Byte length of values array.
 * @param params.elementSize - Single element byte size.
 * @param params.enumEntry - Enums dictionary.
 * @returns Nested strings array.
 */
function parseVariableLengthArrayENUM(params: {
  valuesData: BigTypedArray;
  numberOfElements: number;
  arrayOffsets: TypedArray;
  valuesDataBytesLength: number;
  elementSize: number;
  enumEntry: GLTF_EXT_structural_metadata_Enum;
}): string[][] {
  const {
    valuesData,
    numberOfElements,
    arrayOffsets,
    valuesDataBytesLength,
    elementSize,
    enumEntry
  } = params;
  const attributeValueArray: string[][] = [];
  for (let index = 0; index < numberOfElements; index++) {
    const arrayOffset = arrayOffsets[index];
    const arrayByteSize = arrayOffsets[index + 1] - arrayOffsets[index];
    if (arrayByteSize + arrayOffset > valuesDataBytesLength) {
      break;
    }

    const typedArrayOffset = arrayOffset / elementSize;
    const elementCount = arrayByteSize / elementSize;
    const array: string[] = getEnumsArray(valuesData, typedArrayOffset, elementCount, enumEntry);
    attributeValueArray.push(array);
  }
  return attributeValueArray;
}

/**
 * Parses fixed length ENUM arrays.
 * @param valuesData - Values in a flat typed array.
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param arrayCount - Nested arrays length.
 * @param enumEntry - Enums dictionary.
 * @returns Nested strings array.
 */
function parseFixedLengthArrayENUM(
  valuesData: BigTypedArray,
  numberOfElements: number,
  arrayCount: number,
  enumEntry: GLTF_EXT_structural_metadata_Enum
): string[][] {
  const attributeValueArray: string[][] = [];
  for (let index = 0; index < numberOfElements; index++) {
    const elementOffset = arrayCount * index;
    const array: string[] = getEnumsArray(valuesData, elementOffset, arrayCount, enumEntry);
    attributeValueArray.push(array);
  }
  return attributeValueArray;
}

/**
 * Parses ENUM values into a string array.
 * @param valuesData - Values in a flat typed array.
 * @param offset - Offset to start parse from.
 * @param count - Values length to parse.
 * @param enumEntry - Enums dictionary.
 * @returns Array of strings with parsed ENUM names.
 */
function getEnumsArray(
  valuesData: BigTypedArray,
  offset: number,
  count: number,
  enumEntry: GLTF_EXT_structural_metadata_Enum
): string[] {
  const array: string[] = [];
  for (let i = 0; i < count; i++) {
    // At the moment we don't support BigInt. It requires additional calculations logic
    // and might be an issue in Safari
    if (valuesData instanceof BigInt64Array || valuesData instanceof BigUint64Array) {
      array.push('');
    } else {
      const value = valuesData[offset + i];

      const enumObject = getEnumByValue(enumEntry, value);
      if (enumObject) {
        array.push(enumObject.name);
      } else {
        array.push('');
      }
    }
  }
  return array;
}

/**
 * Looks up ENUM whose `value` property matches the specified number in the parameter `value`.
 * @param {GLTF_EXT_structural_metadata_Enum} enumEntry - ENUM entry containing the array of possible enums.
 * @param {number} value - The value of the ENUM to locate.
 * @returns {GLTF_EXT_structural_metadata_EnumValue | null} ENUM matcihng the specified value or null of no ENUM object was found.
 */
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

/*
  Encoding data
*/

export interface PropertyAttribute {
  name: string;
  elementType: string;
  componentType?: string;
  values: number[] | string[];
}

const SCHEMA_CLASS_ID_DEFAULT = 'schemaClassId';

function encodeExtStructuralMetadata(scenegraph: GLTFScenegraph, options: GLTFWriterOptions) {
  const extension: GLTF_EXT_structural_metadata_GLTF | null = scenegraph.getExtension(
    EXT_STRUCTURAL_METADATA_NAME
  );
  if (!extension) {
    return;
  }
  if (extension.propertyTables) {
    for (const table of extension.propertyTables) {
      const classId = table.class;
      const schemaClass = extension.schema?.classes?.[classId];
      if (table.properties && schemaClass) {
        encodeProperties(table, schemaClass, scenegraph);
      }
    }
  }
}

function encodeProperties(
  table: GLTF_EXT_structural_metadata_PropertyTable,
  schemaClass: GLTF_EXT_structural_metadata_Class,
  scenegraph: GLTFScenegraph
) {
  for (const propertyName in table.properties) {
    const data = table.properties[propertyName].data;
    if (data) {
      const classProperty = schemaClass.properties[propertyName];
      if (classProperty) {
        const tableProperty = createPropertyTableProperty(
          data as number[] | string[],
          classProperty,
          scenegraph
        );
        // Override table property that came with "data"
        table.properties[propertyName] = tableProperty;
      }
    }
  }
}

/**
 * Creates ExtStructuralMetadata, creates the schema and creates a property table containing feature data provided.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyAttributes - property attributes
 * @param classId - classId to use for encoding metadata.
 * @returns Index of the table created.
 */
export function createExtStructuralMetadata(
  scenegraph: GLTFScenegraph,
  propertyAttributes: PropertyAttribute[],
  classId: string = SCHEMA_CLASS_ID_DEFAULT
): number {
  let extension: GLTF_EXT_structural_metadata_GLTF | null = scenegraph.getExtension(
    EXT_STRUCTURAL_METADATA_NAME
  );
  if (!extension) {
    extension = scenegraph.addExtension(EXT_STRUCTURAL_METADATA_NAME);
  }

  extension.schema = createSchema(propertyAttributes, classId, extension.schema);
  const table = createPropertyTable(propertyAttributes, classId, extension.schema);
  if (!extension.propertyTables) {
    extension.propertyTables = [];
  }

  return extension.propertyTables.push(table) - 1; // index of the table
}

function createSchema(
  propertyAttributes: PropertyAttribute[],
  classId: string,
  schemaToUpdate?: GLTF_EXT_structural_metadata_Schema
): GLTF_EXT_structural_metadata_Schema {
  const schema: GLTF_EXT_structural_metadata_Schema = schemaToUpdate ?? {
    id: 'schema_id'
  };
  const schemaClass: GLTF_EXT_structural_metadata_Class = {
    properties: {}
  };
  for (const attribute of propertyAttributes) {
    const classProperty: GLTF_EXT_structural_metadata_ClassProperty = {
      type: attribute.elementType,
      componentType: attribute.componentType
    };
    schemaClass.properties[attribute.name] = classProperty;
  }

  schema.classes = {};
  schema.classes[classId] = schemaClass;
  return schema;
}

function createPropertyTable(
  propertyAttributes: PropertyAttribute[],
  classId: string,
  schema: GLTF_EXT_structural_metadata_Schema
): GLTF_EXT_structural_metadata_PropertyTable {
  const table: GLTF_EXT_structural_metadata_PropertyTable = {
    class: classId,
    count: 0
  };
  // count is a number of rows in the table
  let count = 0;
  const schemaClass = schema.classes?.[classId];

  for (const attribute of propertyAttributes) {
    if (count === 0) {
      count = attribute.values.length;
    }

    // The number of elements in all propertyAttributes must be the same
    if (count !== attribute.values.length && attribute.values.length) {
      throw new Error('Illegal values in attributes');
    }

    const classProperty = schemaClass?.properties[attribute.name];
    if (classProperty) {
      // const tableProperty = createPropertyTableProperty(attribute, classProperty, scenegraph);
      if (!table.properties) {
        table.properties = {};
      }
      // values is a required field. Its real value will be set while encoding data
      table.properties[attribute.name] = {values: 0, data: attribute.values};
    }
  }

  table.count = count;
  return table;
}

function createPropertyTableProperty(
  // attribute: PropertyAttribute,
  values: number[] | string[],
  classProperty: GLTF_EXT_structural_metadata_ClassProperty,
  scenegraph: GLTFScenegraph
): GLTF_EXT_structural_metadata_PropertyTable_Property {
  const prop: GLTF_EXT_structural_metadata_PropertyTable_Property = {values: 0};

  if (classProperty.type === 'STRING') {
    const {stringData, stringOffsets} = createPropertyDataString(values as string[]);
    prop.stringOffsets = createBufferView(stringOffsets, scenegraph);
    prop.values = createBufferView(stringData, scenegraph);
  } else if (classProperty.type === 'SCALAR' && classProperty.componentType) {
    const data = createPropertyDataScalar(values as number[], classProperty.componentType);
    prop.values = createBufferView(data, scenegraph);
  }

  return prop;
}

const COMPONENT_TYPE_TO_ARRAY_CONSTRUCTOR = {
  INT8: Int8Array,
  UINT8: Uint8Array,
  INT16: Int16Array,
  UINT16: Uint16Array,
  INT32: Int32Array,
  UINT32: Uint32Array,
  INT64: Int32Array,
  UINT64: Uint32Array,
  FLOAT32: Float32Array,
  FLOAT64: Float64Array
};

function createPropertyDataScalar(array: number[], componentType: string): TypedArray {
  const numberArray: number[] = [];
  for (const value of array) {
    numberArray.push(Number(value));
  }
  const Construct = COMPONENT_TYPE_TO_ARRAY_CONSTRUCTOR[componentType];
  if (!Construct) {
    throw new Error('Illegal component type');
  }
  return new Construct(numberArray);
}

function createPropertyDataString(strings: string[]): {
  stringData: TypedArray;
  stringOffsets: TypedArray;
} {
  const utf8Encode = new TextEncoder();
  const arr: Uint8Array[] = [];
  let len = 0;
  for (const str of strings) {
    const uint8Array = utf8Encode.encode(str);
    len += uint8Array.length;
    arr.push(uint8Array);
  }
  const strArray = new Uint8Array(len);
  const strOffsets: number[] = [];
  let offset = 0;
  for (const str of arr) {
    strArray.set(str, offset);
    strOffsets.push(offset);
    offset += str.length;
  }
  strOffsets.push(offset); // The last offset represents the byte offset after the last string.
  const stringOffsetsTypedArray = new Uint32Array(strOffsets); // Its length = len+1
  return {stringData: strArray, stringOffsets: stringOffsetsTypedArray};
}

function createBufferView(typedArray: TypedArray, scenegraph: GLTFScenegraph): number {
  scenegraph.gltf.buffers.push({
    arrayBuffer: typedArray.buffer,
    byteOffset: typedArray.byteOffset,
    byteLength: typedArray.byteLength
  });
  return scenegraph.addBufferView(typedArray);
}
