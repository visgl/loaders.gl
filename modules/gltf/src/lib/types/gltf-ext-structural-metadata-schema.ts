import {GLTFTextureInfoMetadata} from './gltf-json-schema';

/* eslint-disable camelcase */

/**
 * glTF extension that provides structural metadata about vertices, texels, and features in a glTF asset.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/glTF.EXT_structural_metadata.schema.json
 */
export type GLTF_EXT_structural_metadata_GLTF = {
  /** An object defining classes and enums. */
  schema?: GLTF_EXT_structural_metadata_Schema;
  /** A uri to an external schema file. */
  schemaUri?: string;
  /** An array of property table definitions, which may be referenced by index. */
  propertyTables?: GLTF_EXT_structural_metadata_PropertyTable[];
  /** An array of property texture definitions, which may be referenced by index. */
  propertyTextures?: GLTF_EXT_structural_metadata_PropertyTexture[];
  /** "An array of property attribute definitions, which may be referenced by index. */
  propertyAttributes?: GLTF_EXT_structural_metadata_PropertyAttribute[];
  /** This is not part of the spec. GLTFLoader loads names of attributes crated into this property */
  dataAttributeNames?: string[];
};

/**
 * An object defining classes and enums.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/schema.schema.json
 */
export type GLTF_EXT_structural_metadata_Schema = {
  /** Unique identifier for the schema. Schema IDs must be alphanumeric identifiers matching the regular expression `^[a-zA-Z_][a-zA-Z0-9_]*$`. */
  id: string;
  /** The name of the schema. */
  name?: string;
  /** The description of the schema. */
  description?: string;
  /** Application-specific version of the schema. */
  version?: string;
  /** A dictionary, where each key is a class ID and each value is an object defining the class. */
  classes?: {
    [key: string]: GLTF_EXT_structural_metadata_Class;
  };
  /** A dictionary, where each key is an enum ID and each value is an object defining the values for the enum. */
  enums?: {
    [key: string]: GLTF_EXT_structural_metadata_Enum;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * An object defining the values of an enum.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/enum.schema.json
 */
export type GLTF_EXT_structural_metadata_Enum = {
  /** The name of the enum, e.g. for display purposes. */
  name?: string;
  /** The description of the enum. */
  description?: string;
  /**
   * The type of the integer enum value.
   * Default value is 'UINT16'
   */
  valueType?: 'INT8' | 'UINT8' | 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'INT64' | 'UINT64';
  /** An array of enum values. Duplicate names or duplicate integer values are not allowed. */
  values: GLTF_EXT_structural_metadata_EnumValue[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * An enum value.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/enum.value.schema.json
 */
export type GLTF_EXT_structural_metadata_EnumValue = {
  /** The name of the enum value. */
  name: string;
  /** The description of the enum value. */
  description?: string;
  /** The integer enum value. */
  value: number;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * A class containing a set of properties.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/class.schema.json
 */
export type GLTF_EXT_structural_metadata_Class = {
  /** The name of the class, e.g. for display purposes. */
  name?: string;
  /** The description of the class. */
  description?: string;
  /**
   * A dictionary, where each key is a property ID and each value is an object defining the property.
   * Property IDs must be alphanumeric identifiers matching the regular expression `^[a-zA-Z_][a-zA-Z0-9_]*$`.
   */
  properties: {
    [key: string]: GLTF_EXT_structural_metadata_ClassProperty;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * A class property.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/class.property.schema.json
 */
export type GLTF_EXT_structural_metadata_ClassProperty = {
  /** The name of the property, e.g. for display purposes. */
  name?: string;

  /** The description of the property. */
  description?: string;

  /** The element type. */
  type:
    | 'SCALAR'
    | 'VEC2'
    | 'VEC3'
    | 'VEC4'
    | 'MAT2'
    | 'MAT3'
    | 'MAT4'
    | 'BOOLEAN'
    | 'STRING'
    | 'ENUM'
    | string;

  /** The datatype of the element's components. Only applicable to `SCALAR`, `VECN`, and `MATN` types. */
  componentType?:
    | 'INT8'
    | 'UINT8'
    | 'INT16'
    | 'UINT16'
    | 'INT32'
    | 'UINT32'
    | 'INT64'
    | 'UINT64'
    | 'FLOAT32'
    | 'FLOAT64'
    | string;

  /** Enum ID as declared in the `enums` dictionary. Required when `type` is `ENUM`. */
  enumType?: string;

  /**
   * Whether the property is an array.
   * When `count` is defined the property is a fixed-length array. Otherwise the property is a variable-length array.
   */
  array?: boolean;

  /** The number of array elements. May only be defined when `array` is true. */
  count?: number;

  /**
   * Specifies whether integer values are normalized.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types with integer component types.
   * For unsigned integer component types, values are normalized between `[0.0, 1.0]`.
   * For signed integer component types, values are normalized between `[-1.0, 1.0]`.
   * For all other component types, this property must be false.
   */
  normalized?: boolean;

  /**
   * An offset to apply to property values.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types when the component type is `FLOAT32` or `FLOAT64`, or when the property is `normalized`.
   */
  offset?: number | number[];

  /**
   * A scale to apply to property values.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types when the component type is `FLOAT32` or `FLOAT64`, or when the property is `normalized`.
   */
  scale?: number | number[];

  /**
   * Maximum allowed value for the property.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types.
   * This is the maximum of all property values, after the transforms based on the `normalized`, `offset`, and `scale` properties have been applied.
   */
  max?: number | number[];

  /**
   * Minimum allowed value for the property.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types.
   * This is the minimum of all property values, after the transforms based on the `normalized`, `offset`, and `scale` properties have been applied.
   */
  min?: number | number[];

  default?: boolean | number | string | number[];
  /**
   * If required, the property must be present in every entity conforming to the class.
   * If not required, individual entities may include `noData` values, or the entire property may be omitted.
   * As a result, `noData` has no effect on a required property.
   * Client implementations may use required properties to make performance optimizations.
   * Default value is false.
   */
  required?: boolean;

  /**
   * A `noData` value represents missing data — also known as a sentinel value — wherever it appears.
   * `BOOLEAN` properties may not specify `noData` values.
   * This is given as the plain property value, without the transforms from the `normalized`, `offset`, and `scale` properties.
   * Must not be defined if `required` is true.
   */
  noData?: number | string | number[] | string[];

  /**
   * An identifier that describes how this property should be interpreted.
   * The semantic cannot be used by other properties in the class.
   */
  semantic?: string;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Properties conforming to a class, organized as property values stored in binary columnar arrays.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTable.schema.json
 */
export type GLTF_EXT_structural_metadata_PropertyTable = {
  /** The name of the property table, e.g. for display purposes. */
  name?: string;
  /** The class that property values conform to. The value must be a class ID declared in the `classes` dictionary. */
  class: string;
  /** The number of elements in each property array. */
  count: number;
  /**
   * A dictionary, where each key corresponds to a property ID in the class' `properties` dictionary
   * and each value is an object describing where property values are stored.
   * Required properties must be included in this dictionary.
   */
  properties?: {
    [key: string]: GLTF_EXT_structural_metadata_PropertyTable_Property;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * An array of binary property values.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTable.property.schema.json
 */
export type GLTF_EXT_structural_metadata_PropertyTable_Property = {
  /**
   * The index of the buffer view containing property values.
   * The data type of property values is determined by the property definition:
   * When `type` is `BOOLEAN` values are packed into a bitstream.
   * When `type` is `STRING` values are stored as byte sequences and decoded as UTF-8 strings.
   * When `type` is `SCALAR`, `VECN`, or `MATN` the values are stored as the provided `componentType`
   * and the buffer view `byteOffset` must be aligned to a multiple of the `componentType` size.
   * When `type` is `ENUM` values are stored as the enum's `valueType`
   * and the buffer view `byteOffset` must be aligned to a multiple of the `valueType` size.
   * Each enum value in the array must match one of the allowed values in the enum definition.
   * `arrayOffsets` is required for variable-length arrays and `stringOffsets` is required for strings (for variable-length arrays of strings, both are required).
   */
  values: number;
  /**
   * The index of the buffer view containing offsets for variable-length arrays.
   * The number of offsets is equal to the property table `count` plus one.
   * The offsets represent the start positions of each array, with the last offset representing the position after the last array.
   * The array length is computed using the difference between the subsequent offset and the current offset.
   * If `type` is `STRING` the offsets index into the string offsets array (stored in `stringOffsets`), otherwise they index into the property array (stored in `values`).
   * The data type of these offsets is determined by `arrayOffsetType`.
   * The buffer view `byteOffset` must be aligned to a multiple of the `arrayOffsetType` size.
   */
  arrayOffsets?: number;
  /**
   * The index of the buffer view containing offsets for strings.
   * The number of offsets is equal to the number of string elements plus one.
   * The offsets represent the byte offsets of each string in the property array (stored in `values`), with the last offset representing the byte offset after the last string.
   * The string byte length is computed using the difference between the subsequent offset and the current offset.
   * The data type of these offsets is determined by `stringOffsetType`.
   * The buffer view `byteOffset` must be aligned to a multiple of the `stringOffsetType` size.
   */
  stringOffsets?: number;
  /**
   * The type of values in `arrayOffsets`.
   * Default value is 'UINT32'
   */
  arrayOffsetType?: 'UINT8' | 'UINT16' | 'UINT32' | 'UINT64' | string;

  /**
   * The type of values in `stringOffsets`.
   * Default value is 'UINT32'
   */
  stringOffsetType?: 'UINT8' | 'UINT16' | 'UINT32' | 'UINT64' | string;
  /**
   * An offset to apply to property values.
   * Only applicable when the component type is `FLOAT32` or `FLOAT64`, or when the property is `normalized`.
   * Overrides the class property's `offset` if both are defined.
   */
  offset?: number | number[];
  /**
   * A scale to apply to property values.
   * Only applicable when the component type is `FLOAT32` or `FLOAT64`, or when the property is `normalized`.
   * Overrides the class property's `scale` if both are defined.
   */
  scale?: number | number[];
  /**
   * Maximum value present in the property values.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types.
   * This is the maximum of all property values, after the transforms based on the `normalized`, `offset`, and `scale` properties have been applied.
   */
  max?: number | number[];
  /**
   * Minimum value present in the property values.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types.
   * This is the minimum of all property values, after the transforms based on the `normalized`, `offset`, and `scale` properties have been applied.
   */
  min?: number | number[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
  /** This is not part of the spec. GLTFLoader loads feature tables data into this property */
  data?: unknown;
};

/**
 * Properties conforming to a class, organized as property values stored in textures.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTexture.schema.json
 */
export type GLTF_EXT_structural_metadata_PropertyTexture = {
  /** The name of the property texture, e.g. for display purposes. */
  name?: string;
  /** The class that property values conform to. The value must be a class ID declared in the `classes` dictionary. */
  class: string;
  /**
   * A dictionary, where each key corresponds to a property ID in the class' `properties` dictionary
   * and each value is an object describing where property values are stored.
   * Required properties must be included in this dictionary.
   *
   * https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata
   * Each property that is defined in the propertyTexture object extends the glTF textureInfo object.
   * The texCoord specifies a texture coordinate set in the referring primitive.
   * The index is the index of the glTF texture object that stores the actual data. Additionally,
   * each property specifies an array of channels, which are the indices of the texture channels providing data for the respective property.
   * Channels of an RGBA texture are numbered 0..3 respectively.
   */
  properties?: {
    [key: string]: GLTFTextureInfoMetadata;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Properties conforming to a class, organized as property values stored in attributes.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyAttribute.schema.json
 */
export type GLTF_EXT_structural_metadata_PropertyAttribute = {
  /** The name of the property attribute, e.g. for display purposes. */
  name?: string;
  /** The class that property values conform to. The value must be a class ID declared in the `classes` dictionary. */
  class: string;
  /**
   * "A dictionary, where each key corresponds to a property ID in the class' `properties` dictionary
   * and each value is an object describing where property values are stored.
   * Required properties must be included in this dictionary.
   */
  properties?: {
    [key: string]: unknown;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Structural metadata about a glTF primitive.
 * @see https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/mesh.primitive.EXT_structural_metadata.schema.json
 */
export type GLTF_EXT_structural_metadata_Primitive = {
  /** An array of indexes of property textures in the root `EXT_structural_metadata` object. */
  propertyTextures?: number[];
  /** An array of indexes of property attributes in the root `EXT_structural_metadata` object. */
  propertyAttributes?: number[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};
