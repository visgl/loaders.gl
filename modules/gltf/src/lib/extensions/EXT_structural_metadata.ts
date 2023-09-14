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
  GLTF_EXT_structural_metadata_Primitive
} from '../types/gltf-ext-structural-metadata-schema';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {
  convertRawBufferToMetadataArray,
  getPrimitiveTextureData,
  primitivePropertyDataToAttributes,
  getArrayElementByteSize,
  NumericComponentType,
  getOffsetsForProperty
} from './utils/3d-tiles-utils';

const EXT_STRUCTURAL_METADATA_NAME = 'EXT_structural_metadata';
export const name = EXT_STRUCTURAL_METADATA_NAME;

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtStructuralMetadata(scenegraph, options);
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
 * Returns the property table populated with the data taken according to the extension schema.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyTableIndex - Index of the property table to locate.
 * @returns Property table populated with the data.
 * Throws an exception if no property table was found for propertyTableIndex provided.
 */
export function getPropertyTablePopulated(
  scenegraph: GLTFScenegraph,
  propertyTableIndex: number
): GLTF_EXT_structural_metadata_PropertyTable {
  const extension: GLTF_EXT_structural_metadata_GLTF | null = scenegraph.getExtension(
    EXT_STRUCTURAL_METADATA_NAME
  );
  const propertyTable = extension?.propertyTables?.[propertyTableIndex];
  if (extension?.schema && propertyTable) {
    processPropertyTable(scenegraph, extension.schema, propertyTable);
    return propertyTable;
  }
  throw new Error(
    `Incorrect data in the EXT_structural_metadata extension: no property table with index ${propertyTableIndex}`
  );
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param options - loader options.
 */
function decodeExtStructuralMetadata(scenegraph: GLTFScenegraph, options: GLTFLoaderOptions): void {
  const extension: GLTF_EXT_structural_metadata_GLTF | null = scenegraph.getExtension(
    EXT_STRUCTURAL_METADATA_NAME
  );
  if (!extension?.schema) {
    return;
  }

  const propertyTextures = extension.propertyTextures;
  const json = scenegraph.gltf.json;
  if (propertyTextures && json.meshes && options?.gltf?.loadImages) {
    // Iterate through all meshes/primitives.
    for (const mesh of json.meshes) {
      for (const primitive of mesh.primitives) {
        processPrimitivePropertyTextures(scenegraph, propertyTextures, primitive, extension);
      }
    }
  }

  const schemaClasses = extension.schema.classes;
  const propertyTables = extension.propertyTables;
  if (schemaClasses && propertyTables) {
    for (const schemaName in schemaClasses) {
      const propertyTable = findPropertyTableByClass(propertyTables, schemaName);
      if (propertyTable) {
        processPropertyTable(scenegraph, extension.schema, propertyTable);
      }
    }
  }
}

/**
 * Find the property table by class name.
 * @param propertyTables - propertyTable definition taken from the top-level extension
 * @param schemaClassName - class name in the extension schema
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
 * Takes data from property textures reffered by the primitive
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyTextures - propertyTexture definition taken from the top-level extention
 * @param primitive - Primitive object
 * @param extension - top-level extension
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
 * Takes property data from the texture pointed by the primitive and appends them to `exension.data`
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param propertyTexture - propertyTexture definition taken from the top-level extension.
 * @param primitive - Primitive object
 * @param extension - top-level extension
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
  for (const propName in propertyTexture.properties) {
    // propName has values like "speed", "direction"
    // Make attributeName as a combination of the class name and the propertyName like "wind_speed" or "wind_direction"
    const attributeName = `${className}_${propName}`;
    const textureInfoTopLevel: GLTFTextureInfoMetadata | undefined =
      propertyTexture.properties?.[propName];
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
 * @param schema - schema object
 * @param propertyTable - propertyTable definition taken from the top-level extension
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
 * Decodes a propertyTable column from binary source based on property type
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param schema - Schema object
 * @param classProperty - class property object
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param propertyTableProperty - propertyTable's property metadata
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
      data = getPropertyDataString(
        classProperty,
        numberOfElements,
        valuesDataBytes,
        arrayOffsets,
        stringOffsets
      );
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
 * Parse propertyTable.property.arrayOffsets that are offsets of sub-arrays in a flatten array of values
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param classProperty - class property object
 * @param propertyTableProperty - propertyTable's property metadata
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @returns typed array with offset values
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
    typeof propertyTableProperty.arrayOffsets !== 'undefined' &&
    typeof propertyTableProperty.arrayOffsetType !== 'undefined'
  ) {
    // Data are in a VARIABLE-length array
    return getOffsetsForProperty(
      scenegraph,
      propertyTableProperty.arrayOffsets,
      propertyTableProperty.arrayOffsetType,
      numberOfElements
    );
  }
  return null;
}

/**
 * Parse propertyTable.property.stringOffsets
 * @param scenegraph - Instance of the class for structured access to GLTF data
 * @param propertyTableProperty - propertyTable's property metadata
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table
 * @returns typed array with offset values
 * @see https://github.com/CesiumGS/glTF/blob/2976f1183343a47a29e4059a70961371cd2fcee8/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTable.property.schema.json#L29C10-L29C23
 */
function getStringOffsetsForProperty(
  scenegraph: GLTFScenegraph,
  propertyTableProperty: GLTF_EXT_structural_metadata_PropertyTable_Property,
  numberOfElements: number
): TypedArray | null {
  if (
    typeof propertyTableProperty.stringOffsets !== 'undefined' && // `stringOffsets` is an index of the buffer view containing offsets for strings.
    typeof propertyTableProperty.stringOffsetType !== 'undefined'
  ) {
    // Data are in a FIXED-length array
    return getOffsetsForProperty(
      scenegraph,
      propertyTableProperty.stringOffsets,
      propertyTableProperty.stringOffsetType,
      numberOfElements
    );
  }
  return null;
}

/**
 * Decodes properties of SCALAR, VEC-N, MAT-N types from binary sourse.
 * @param classProperty - class property object
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param valuesDataBytes - data taken from values property of the property table property.
 * @param arrayOffsets - offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @returns property values in a typed array or in an array of typed arrays
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

  let valuesData: BigTypedArray | null;
  if (classProperty.componentType) {
    valuesData = convertRawBufferToMetadataArray(
      valuesDataBytes,
      classProperty.type,
      // The datatype of the element's components. Only applicable to `SCALAR`, `VECN`, and `MATN` types.
      classProperty.componentType as NumericComponentType,
      elementCount
    );
    if (!valuesData) {
      valuesData = valuesDataBytes;
    }
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
 * Parse variable-length array data.
 * In this case every value of the property in the table will be an array
 * of arbitrary length
 * @param valuesData - values in a flat typed array
 * @param numberOfElements - number of rows in the property table
 * @param arrayOffsets - offsets of nested arrays in the flat values array
 * @param valuesDataBytesLength - data byte length
 * @param valueSize - value size in bytes
 * @returns array of typed arrays
 */
function parseVariableLengthArrayNumeric(
  valuesData: BigTypedArray,
  numberOfElements: number,
  arrayOffsets: TypedArray,
  valuesDataBytesLength: number,
  valueSize: number
): BigTypedArray[] {
  const attributeValueArray: BigTypedArray[] = [];
  for (let index = 0; index < numberOfElements; index++) {
    const arrayOffset = arrayOffsets[index];
    const arrayByteSize = arrayOffsets[index + 1] - arrayOffsets[index];
    if (arrayByteSize + arrayOffset > valuesDataBytesLength) {
      break;
    }
    const typedArrayOffset = arrayOffset / valueSize;
    const elementCount = arrayByteSize / valueSize;
    attributeValueArray.push(valuesData.slice(typedArrayOffset, typedArrayOffset + elementCount));
  }
  return attributeValueArray;
}

/**
 * Parse fixed-length array data
 * In this case every value of the property in the table will be an array
 * of constant length equal to `arrayCount`
 * @param valuesData - values in a flat typed array
 * @param numberOfElements - number of rows in the property table
 * @param arrayCount - nested arrays length
 * @returns array of typed arrays
 */
function parseFixedLengthArrayNumeric(
  valuesData: BigTypedArray,
  numberOfElements: number,
  arrayCount: number
): BigTypedArray[] {
  const attributeValueArray: BigTypedArray[] = [];
  for (let index = 0; index < numberOfElements; index++) {
    const elementOffset = index * arrayCount;
    attributeValueArray.push(valuesData.slice(elementOffset, elementOffset + arrayCount));
  }
  return attributeValueArray;
}

/**
 * Decodes properties of string type from binary source.
 * @param classProperty - class property object
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param valuesDataBytes - data taken from values property of the property table property.
 * @param arrayOffsets - offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @param stringOffsets - index of the buffer view containing offsets for strings. It should be available for string type.
 * @returns string property values
 */
function getPropertyDataString(
  classProperty: GLTF_EXT_structural_metadata_ClassProperty,
  numberOfElements: number,
  valuesDataBytes: Uint8Array,
  arrayOffsets: TypedArray | null,
  stringOffsets: TypedArray | null
): string[] | string[][] {
  if (arrayOffsets) {
    // TODO: implement it as soon as we have the corresponding tileset
    throw new Error(`Not implemented - classProperty.type=${classProperty.type}`);
  }

  if (stringOffsets) {
    const stringsArray: string[] = [];
    const textDecoder = new TextDecoder('utf8');

    let stringOffset = 0;
    for (let index = 0; index < numberOfElements; index++) {
      const stringByteSize = stringOffsets[index + 1] - stringOffsets[index];

      if (stringByteSize + stringOffset <= valuesDataBytes.length) {
        const stringData = valuesDataBytes.subarray(stringOffset, stringByteSize + stringOffset);
        const stringAttribute = textDecoder.decode(stringData);

        stringsArray.push(stringAttribute);
        stringOffset += stringByteSize;
      }
    }

    return stringsArray;
  }
  return [];
}

/**
 * Decodes properties of enum type from binary source.
 * @param schema - schema object
 * @param classProperty - class property object
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param valuesDataBytes - data taken from values property of the property table property.
 * @param arrayOffsets - offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @returns strings array of nested strings array
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
 * Parse variable length nested ENUM arrays
 * @param params.valuesData - values in a flat typed array
 * @param params.numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param params.arrayOffsets - offsets for variable-length arrays. It's null for fixed-length arrays or scalar types.
 * @param params.valuesDataBytesLength - byte length of values array
 * @param params.elementSize - single element byte size
 * @param params.enumEntry - enums dictionary
 * @returns nested strings array
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
 * Parse fixed length ENUM arrays
 * @param valuesData - values in a flat typed array
 * @param numberOfElements - The number of elements in each property array that propertyTableProperty contains. It's a number of rows in the table.
 * @param arrayCount - nested arrays length
 * @param enumEntry - enums dictionary
 * @returns  nested strings array
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
 * Parse ENUM values into a string array
 * @param valuesData - values in a flat typed array
 * @param offset - offset to start parse from
 * @param count - values length to parse
 * @param enumEntry - enums dictionary
 * @returns array of string with parsed ENUM names
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
 * @param {number} value - the value of the ENUM to locate.
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
