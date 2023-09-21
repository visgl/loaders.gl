import {GLTFTextureInfo} from './gltf-json-schema';

/* eslint-disable camelcase */

/**
 * EXT_feature_metadata extension types
 * This extension has glTF-level metadata and primitive-level feature indexing and segmentation metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 *
 * glTF-level metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#gltf-extension-1
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/schema/glTF.EXT_feature_metadata.schema.json
 */
export type GLTF_EXT_feature_metadata_GLTF = {
  /** An object defining classes and enums. */
  schema?: GLTF_EXT_feature_metadata_Schema;
  /** A uri to an external schema file. */
  schemaUri?: string;
  /** An object containing statistics about features. */
  statistics?: GLTF_EXT_feature_metadata_Statistics;
  /** A dictionary, where each key is a feature table ID and each value is an object defining the feature table. */
  featureTables?: {
    [key: string]: GLTF_EXT_feature_metadata_FeatureTable;
  };
  /** A dictionary, where each key is a feature texture ID and each value is an object defining the feature texture. */
  featureTextures?: {
    [key: string]: GLTF_EXT_feature_metadata_FeatureTexture;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * An object defining classes and enums.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#schema
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/schema.schema.json
 */
export type GLTF_EXT_feature_metadata_Schema = {
  /** The name of the schema. */
  name?: string;
  /** The description of the schema. */
  description?: string;
  /** Application-specific version of the schema. */
  version?: string;
  /** A dictionary, where each key is a class ID and each value is an object defining the class. */
  classes?: {
    [key: string]: GLTF_EXT_feature_metadata_Class;
  };
  /** A dictionary, where each key is an enum ID and each value is an object defining the values for the enum. */
  enums?: {
    [key: string]: GLTF_EXT_feature_metadata_Enum;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * A class containing a set of properties.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/class.schema.json
 */
export type GLTF_EXT_feature_metadata_Class = {
  /** The name of the class, e.g. for display purposes. */
  name?: string;
  /** The description of the class. */
  description?: string;
  /** A dictionary, where each key is a property ID and each value is an object defining the property. */
  properties: {
    [key: string]: GLTF_EXT_feature_metadata_ClassProperty;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * A class property.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class-property
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/class.property.schema.json
 */
export type GLTF_EXT_feature_metadata_ClassProperty = {
  /** The name of the property, e.g. for display purposes. */
  name?: string;
  /** The description of the property. */
  description?: string;
  /**
   * The property type. If ENUM is used, then enumType must also be specified.
   * If ARRAY is used, then componentType must also be specified.
   * ARRAY is a fixed-length array when componentCount is defined, and variable-length otherwise.
   */
  type:
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
    | 'BOOLEAN'
    | 'STRING'
    | 'ENUM'
    | 'ARRAY'
    | string;
  /**
   * An enum ID as declared in the enums dictionary.
   * This value must be specified when type or componentType is ENUM.
   */
  enumType?: string;
  /**
   * When type is ARRAY this indicates the type of each component of the array.
   * If ENUM is used, then enumType must also be specified.
   */
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
    | 'BOOLEAN'
    | 'STRING'
    | 'ENUM'
    | string;
  /** The number of components per element for ARRAY elements. */
  componentCount?: number;
  /**
   * Specifies whether integer values are normalized.
   * This applies both when type is an integer type, or when type is ARRAY with a componentType that is an integer type.
   * For unsigned integer types, values are normalized between [0.0, 1.0].
   * For signed integer types, values are normalized between [-1.0, 1.0].
   * For all other types, this property is ignored.
   */
  normalized: boolean;
  /**
   * Maximum allowed values for property values.
   * Only applicable for numeric types and fixed-length arrays of numeric types.
   * For numeric types this is a single number.
   * For fixed-length arrays this is an array with componentCount number of elements.
   * The normalized property has no effect on these values: they always correspond to the integer values.
   */
  max?: number | number[];
  /**
   * Minimum allowed values for property values.
   * Only applicable for numeric types and fixed-length arrays of numeric types.
   * For numeric types this is a single number.
   * For fixed-length arrays this is an array with componentCount number of elements.
   * The normalized property has no effect on these values: they always correspond to the integer values.
   */
  min?: number | number[];
  /**
   * A default value to use when the property value is not defined.
   * If used, optional must be set to true.
   * The type of the default value must match the property definition: For BOOLEAN use true or false.
   * For STRING use a JSON string. For a numeric type use a JSON number.
   * For ENUM use the enum name, not the integer value.
   * For ARRAY use a JSON array containing values matching the componentType.
   */
  default?: boolean | number | string | number[];
  /** If true, this property is optional. */
  optional?: boolean; // default false;
  /**
   * An identifier that describes how this property should be interpreted.
   * The semantic cannot be used by other properties in the class.
   */
  semantic?: string;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * An object defining the values of an enum.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#enum
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/schema/enum.schema.json
 */
export type GLTF_EXT_feature_metadata_Enum = {
  /** The name of the enum, e.g. for display purposes. */
  name?: string;
  /** The description of the enum. */
  description?: string;
  /** The type of the integer enum value. */
  valueType?: 'INT8' | 'UINT8' | 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'INT64' | 'UINT64'; // default: "UINT16"
  /** An array of enum values. Duplicate names or duplicate integer values are not allowed. */
  values: GLTF_EXT_feature_metadata_EnumValue[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
  [key: string]: unknown;
};

/**
 * An enum value.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#enum-value
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/schema/enum.value.schema.json
 */
export type GLTF_EXT_feature_metadata_EnumValue = {
  /** The name of the enum value. */
  name: string;
  /** The description of the enum value. */
  description?: string;
  /** The integer enum value. */
  value: number; // default: "UINT16"
  extensions?: Record<string, unknown>;
  extras?: unknown;
  [key: string]: unknown;
};

/**
 * A feature table defined by a class and property values stored in arrays.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-table
 * JSON Schenma - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureTable.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureTable = {
  /** The class that property values conform to. The value must be a class ID declared in the classes dictionary. */
  class?: string;
  /** The number of features, as well as the number of elements in each property array. */
  count: number;
  /**
   * A dictionary, where each key corresponds to a property ID in the class properties dictionary
   * and each value is an object describing where property values are stored.
   * Optional properties may be excluded from this dictionary.
   */
  properties?: {
    [key: string]: GLTF_EXT_feature_metadata_FeatureTableProperty;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * An array of binary property values.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-table-property
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureTable.property.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureTableProperty = {
  /**
   * The index of the buffer view containing property values.
   * The data type of property values is determined by the property definition:
   * When type is BOOLEAN values are packed into a bitfield.
   * When type is STRING values are stored as byte sequences and decoded as UTF-8 strings.
   * When type is a numeric type values are stored as the provided type.
   * When type is ENUM values are stored as the enum's valueType.
   * Each enum value in the buffer must match one of the allowed values in the enum definition.
   * When type is ARRAY elements are packed tightly together and the data type is based on the componentType following the same rules as above.
   * arrayOffsetBufferView is required for variable-size arrays
   * and stringOffsetBufferView is required for strings (for variable-length arrays of strings, both are required)
   * The buffer view byteOffset must be aligned to a multiple of 8 bytes.
   * If the buffer view's buffer is the GLB-stored BIN chunk the byte offset is measured relative to the beginning of the GLB.
   * Otherwise it is measured relative to the beginning of the buffer.
   */
  bufferView: number;

  /** The type of values in arrayOffsetBufferView and stringOffsetBufferView. */
  offsetType?: 'UINT8' | 'UINT16' | 'UINT32' | 'UINT64' | string; // default: "UINT32"
  /**
   * The index of the buffer view containing offsets for variable-length arrays.
   * The number of offsets is equal to the feature table count plus one.
   * The offsets represent the start positions of each array, with the last offset representing the position after the last array.
   * The array length is computed using the difference between the current offset and the subsequent offset.
   * If componentType is STRING the offsets index into the string offsets array (stored in stringOffsetBufferView),
   * otherwise they index into the property array (stored in bufferView).
   * The data type of these offsets is determined by offsetType.
   * The buffer view byteOffset must be aligned to a multiple of 8 bytes in the same manner as the main bufferView
   */
  arrayOffsetBufferView?: number;
  /**
   * The index of the buffer view containing offsets for strings.
   * The number of offsets is equal to the number of string components plus one.
   * The offsets represent the byte offsets of each string in the main bufferView,
   * with the last offset representing the byte offset after the last string.
   * The string byte length is computed using the difference between the current offset and the subsequent offset.
   * The data type of these offsets is determined by offsetType.
   * The buffer view byteOffset must be aligned to a multiple of 8 bytes in the same manner as the main bufferView.
   */
  stringOffsetBufferView?: number;
  extensions?: Record<string, unknown>;
  extras?: unknown;
  /** This is not part of the spec. GLTFLoader loads feature tables data into this property */
  data: unknown;
};

/**
 * Features whose property values are stored directly in texture channels. This is not to be confused with feature ID textures which store feature IDs for use with a feature table.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-texture
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureTexture.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureTexture = {
  /** The class this feature texture conforms to. The value must be a class ID declared in the classes dictionary. */
  class: string;
  /**
   * A dictionary, where each key corresponds to a property ID in the class properties dictionary
   * and each value describes the texture channels containing property values.
   */
  properties: {
    [key: string]: GLTF_EXT_feature_metadata_TextureAccessor;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * A description of how to access property values from the color channels of a texture.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#texture-accessor
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/textureAccessor.schema.json
 */
export type GLTF_EXT_feature_metadata_TextureAccessor = {
  /** Texture channels containing property values. Channels are labeled by rgba and are swizzled with a string of 1-4 characters. */
  channels: string;
  /** The glTF texture and texture coordinates to use. */
  texture: GLTFTextureInfo;
  extensions?: Record<string, unknown>;
  extras?: unknown;
  /** This is not part of the spec. GLTFLoader loads feature tables data into this property */
  data: unknown;
};

/**
 * Statistics about features.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#statistics-1
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/statistics.schema.json
 */
export type GLTF_EXT_feature_metadata_Statistics = {
  /**
   * A dictionary, where each key is a class ID declared in the classes dictionary
   * and each value is an object containing statistics about features that conform to the class.
   */
  classes?: {
    [key: string]: GLTF_EXT_feature_metadata_StatisticsClass;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Statistics about features that conform to the class.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class-statistics
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/statistics.class.property.schema.json
 */
export type GLTF_EXT_feature_metadata_StatisticsClass = {
  /** The number of features that conform to the class. */
  count?: number;
  /**
   * A dictionary, where each key is a class ID declared in the classes dictionary
   * and each value is an object containing statistics about property values.
   */
  properties?: {
    [key: string]: GLTF_EXT_feature_metadata_StatisticsClassProperty;
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * min, max, mean, median, standardDeviation, variance, sum are
 * only applicable for numeric types and fixed-length arrays of numeric types.
 * For numeric types this is a single number.
 * For fixed-length arrays this is an array with componentCount number of elements.
 * The normalized property has no effect on these values.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#property-statistics
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/statistics.class.property.schema.json
 */
export type GLTF_EXT_feature_metadata_StatisticsClassProperty = {
  /** The minimum property value. */
  min?: number | number[];
  /** The maximum property value. */
  max?: number | number[];
  /** The arithmetic mean of the property values. */
  mean?: number | number[];
  /** The median of the property values. */
  median?: number | number[];
  /** The standard deviation of the property values. */
  standardDeviation?: number | number[];
  /** The variance of the property values. */
  variance?: number | number[];
  /** The sum of the property values. */
  sum?: number | number[];
  /**
   * A dictionary, where each key corresponds to an enum name and each value is the number of occurrences of that enum.
   * Only applicable when type or componentType is ENUM.
   * For fixed-length arrays, this is an array with componentCount number of elements.
   */
  occurrences: {
    [key: string]: number | number[];
  };
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * EXT_feature_metadata extension types
 * This extension has glTF-level metadata and primitive-level (feature indexing and segmentation) metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 *
 * primitive-level metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#primitive-extension
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/mesh.primitive.EXT_feature_metadata.schema.json
 */
export type GLTF_EXT_feature_metadata_Primitive = {
  /** Feature ids definition in attributes */
  featureIdAttributes?: GLTF_EXT_feature_metadata_FeatureIdAttribute[];
  /** Feature ids definition in textures */
  featureIdTextures?: GLTF_EXT_feature_metadata_FeatureIdTexture[];
  /** An array of IDs of feature textures from the root EXT_feature_metadata object. */
  featureTextures?: string[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Attribute which described featureIds definition.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-id-attribute
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureIdAttribute.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdAttribute = {
  /** Name of feature table */
  featureTable: string;
  /** Described how feature ids are defined */
  featureIds: GLTF_EXT_feature_metadata_FeatureIdAttributeFeatureIds;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/**
 * Defining featureIds by attributes or implicitly.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#primitive-extensionfeatureidattributes
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureIdAttribute.featureIds.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdAttributeFeatureIds = {
  /** Name of attribute where featureIds are defined */
  attribute?: string;
  /** Sets a constant feature ID for each vertex. The default is 0. */
  constant?: number;
  /** Sets the rate at which feature IDs increment.
   * If divisor is zero then constant is used.
   * If divisor is greater than zero the feature ID increments once per divisor sets of vertices, starting at constant.
   * The default is 0
   */
  divisor?: number;
};

/**
 * An object describing a texture used for storing per-texel feature IDs.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-id-texture
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureIdTexture.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdTexture = {
  /** The ID of the feature table in the model's root `EXT_feature_metadata.featureTables` dictionary. */
  featureTable: string;
  /** A description of the texture and channel to use for feature IDs. The `channels` property must have a single channel. Furthermore,
   * feature IDs must be whole numbers in the range `[0, count - 1]` (inclusive), where `count` is the total number of features
   * in the feature table. Texel values must be read as integers. Texture filtering should be disabled when fetching feature IDs.
   */
  featureIds: GLTF_EXT_feature_metadata_FeatureIdTextureAccessor;
};

/**
 * A description of how to access property values from the color channels of a texture.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#featureidtexturefeatureids
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/textureAccessor.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdTextureAccessor = {
  /** gLTF textureInfo object - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/specification/2.0/schema/textureInfo.schema.json */
  texture: GLTFTextureInfo;
  /** Must be a single channel ("r", "g", "b", or "a") */
  channels: 'r' | 'g' | 'b' | 'a';
};
