// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import type {ArrowTableBatch, DataType, Field, Schema} from '@loaders.gl/schema';
import {TileConversionError} from './conversion-api.js';

const DEFAULT_FEATURE_ID_FIELD = 'feature_id';
const FEATURE_CLASS_METADATA_KEY = 'loaders.gl:feature-class';

/** Feature attributes and source identifier ready for Arrow normalization. */
export interface TileFeatureAttributes {
  /** Stable feature identifier decoded from the source's feature-ID descriptor. */
  readonly featureId: string | number | bigint;
  /** Property values interpreted from the source metadata class. */
  readonly properties: Readonly<Record<string, unknown>>;
  /** Original class or property-table name, kept distinct between output batches. */
  readonly metadataClass: string;
  /** Optional original encoded metadata bytes, preserved without interpretation. */
  readonly rawMetadata?: Uint8Array;
}

/** Explicit Arrow mapping and bounded output size for feature attribute batches. */
export interface FeatureArrowBatchOptions {
  /** Declared output columns and types, including the feature-ID column. */
  readonly schema: Schema;
  /** Schema field receiving stable feature identifiers. Defaults to `feature_id`. */
  readonly featureIdField?: string;
  /** Optional binary field receiving source metadata bytes. */
  readonly rawMetadataField?: string;
  /** Maximum number of features in one emitted Arrow record batch. Defaults to 65,536. */
  readonly batchSize?: number;
}

/**
 * Converts decoded feature attributes to bounded Arrow batches using a caller-declared schema.
 *
 * Values retain their source primitive types; nested lists, structs, dictionary enums, and 64-bit
 * identifiers use the corresponding schema field type. Missing schema fields and incompatible
 * identifiers fail explicitly. Unknown properties are rejected so a class mapping cannot silently
 * discard data. Separate metadata classes should be passed separately with their own schema.
 *
 * @param features - Features decoded from one source metadata class.
 * @param options - Explicit Arrow schema and batch configuration.
 * @returns Arrow table batches whose schema metadata records the source metadata class.
 */
export function convertFeatureAttributesToArrowBatches(
  features: readonly TileFeatureAttributes[],
  options: FeatureArrowBatchOptions
): ArrowTableBatch[] {
  const featureIdField = options.featureIdField || DEFAULT_FEATURE_ID_FIELD;
  const batchSize = options.batchSize ?? 65_536;
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new TileConversionError(
      'INVALID_FEATURE_BATCH_SIZE',
      'Feature Arrow batch size must be a positive integer'
    );
  }

  const featureClasses = new Set(features.map(feature => feature.metadataClass));
  if (featureClasses.size > 1) {
    throw new TileConversionError(
      'MULTIPLE_FEATURE_CLASSES',
      'Build separate Arrow batches for each source metadata class'
    );
  }
  const metadataClass = features[0]?.metadataClass;
  const schema = makeFeatureSchema(
    options.schema,
    featureIdField,
    options.rawMetadataField,
    metadataClass
  );
  const fieldsByName = new Map(schema.fields.map(field => [field.name, field]));
  const propertyFieldNames = new Set(
    schema.fields
      .filter(field => field.name !== featureIdField && field.name !== options.rawMetadataField)
      .map(field => field.name)
  );

  for (const feature of features) {
    validateFeatureIdentifier(feature.featureId, fieldsByName.get(featureIdField)?.type);
    if (feature.rawMetadata && !options.rawMetadataField) {
      throw new TileConversionError(
        'RAW_METADATA_FIELD_REQUIRED',
        'A rawMetadataField must be declared to preserve encoded source metadata'
      );
    }
    for (const propertyName of Object.keys(feature.properties)) {
      if (!propertyFieldNames.has(propertyName)) {
        throw new TileConversionError(
          'FEATURE_PROPERTY_NOT_MAPPED',
          `Feature property "${propertyName}" is not declared in the Arrow schema`
        );
      }
    }
  }

  const batches: ArrowTableBatch[] = [];
  for (let batchStart = 0; batchStart < features.length; batchStart += batchSize) {
    const tableBuilder = new ArrowTableBuilder(schema);
    const batchFeatures = features.slice(batchStart, batchStart + batchSize);
    for (const feature of batchFeatures) {
      const row: Record<string, unknown> = {
        ...feature.properties,
        [featureIdField]: feature.featureId
      };
      if (options.rawMetadataField) {
        row[options.rawMetadataField] = feature.rawMetadata || null;
      }
      for (const field of schema.fields) {
        if (row[field.name] === undefined) {
          row[field.name] = null;
        }
        validateFeatureValue(field, row[field.name], field.name);
      }
      tableBuilder.addObjectRow(row);
    }
    const batch = tableBuilder.finishBatch();
    if (batch) {
      batches.push(batch);
    }
  }
  return batches;
}

/** Adds feature class metadata and validates the required ID and raw metadata mappings. */
function makeFeatureSchema(
  sourceSchema: Schema,
  featureIdField: string,
  rawMetadataField: string | undefined,
  metadataClass: string | undefined
): Schema {
  const fieldsByName = new Map(sourceSchema.fields.map(field => [field.name, field]));
  if (fieldsByName.size !== sourceSchema.fields.length) {
    throw new TileConversionError(
      'DUPLICATE_FEATURE_FIELDS',
      'Arrow schema fields must have unique names'
    );
  }
  const featureIdType = fieldsByName.get(featureIdField)?.type;
  if (!featureIdType) {
    throw new TileConversionError(
      'FEATURE_ID_FIELD_REQUIRED',
      `Arrow schema must declare the feature identifier field "${featureIdField}"`
    );
  }
  if (rawMetadataField && !fieldsByName.has(rawMetadataField)) {
    throw new TileConversionError(
      'RAW_METADATA_FIELD_NOT_DECLARED',
      `Arrow schema does not declare the raw metadata field "${rawMetadataField}"`
    );
  }
  if (rawMetadataField === featureIdField) {
    throw new TileConversionError(
      'FEATURE_FIELDS_COLLIDE',
      'The feature identifier and raw metadata require separate Arrow fields'
    );
  }
  if (rawMetadataField && !isBinaryType(fieldsByName.get(rawMetadataField)?.type)) {
    throw new TileConversionError(
      'RAW_METADATA_FIELD_NOT_BINARY',
      `Arrow schema field "${rawMetadataField}" must use binary or fixed-size-binary type`
    );
  }
  return {
    ...sourceSchema,
    metadata: {
      ...(sourceSchema.metadata || {}),
      ...(metadataClass ? {[FEATURE_CLASS_METADATA_KEY]: metadataClass} : {})
    }
  };
}

/** Rejects identifier values that the declared Arrow type cannot preserve exactly. */
function validateFeatureIdentifier(featureId: string | number | bigint, dataType?: DataType): void {
  const isStringIdentifier = typeof featureId === 'string';
  const isIntegerIdentifier = typeof featureId === 'bigint' || Number.isSafeInteger(featureId);
  const isStringType = dataType === 'utf8' || dataType === 'utf8-view';
  if (
    (isStringIdentifier && isStringType) ||
    (isIntegerIdentifier && isIntegerDataType(dataType))
  ) {
    return;
  }
  throw new TileConversionError(
    'FEATURE_ID_TYPE_MISMATCH',
    `Feature identifier ${String(featureId)} is not compatible with the declared Arrow type`
  );
}

/** Rejects nulls, implicit coercions, and out-of-range values before Arrow writes a field. */
function validateFeatureValue(field: Field, value: unknown, fieldPath: string): void {
  if (value === null || value === undefined) {
    if (field.nullable === false) {
      throw new TileConversionError(
        'FEATURE_VALUE_REQUIRED',
        `Required Arrow field "${fieldPath}" has no value`
      );
    }
    return;
  }

  const dataType = field.type;
  if (typeof dataType === 'object') {
    if (dataType.type === 'dictionary') {
      validateFeatureValue({...field, type: dataType.dictionary}, value, fieldPath);
      return;
    }
    if (dataType.type === 'list' || dataType.type === 'large-list') {
      if (!Array.isArray(value)) {
        throw createFeatureValueTypeError(fieldPath, 'an array');
      }
      const childField = dataType.children[0];
      for (let index = 0; index < value.length; index++) {
        validateFeatureValue(childField, value[index], `${fieldPath}[${index}]`);
      }
      return;
    }
    if (dataType.type === 'fixed-size-list') {
      if (!Array.isArray(value) || value.length !== dataType.listSize) {
        throw createFeatureValueTypeError(fieldPath, `an array of length ${dataType.listSize}`);
      }
      const childField = dataType.children[0];
      for (let index = 0; index < value.length; index++) {
        validateFeatureValue(childField, value[index], `${fieldPath}[${index}]`);
      }
      return;
    }
    if (dataType.type === 'struct') {
      if (!isRecord(value)) {
        throw createFeatureValueTypeError(fieldPath, 'an object');
      }
      const childNames = new Set(dataType.children.map(childField => childField.name));
      const unknownNames = Object.keys(value).filter(name => !childNames.has(name));
      if (unknownNames.length > 0) {
        throw new TileConversionError(
          'FEATURE_PROPERTY_NOT_MAPPED',
          `Nested feature properties "${unknownNames.join(', ')}" are not declared under "${fieldPath}"`
        );
      }
      for (const childField of dataType.children) {
        validateFeatureValue(childField, value[childField.name], `${fieldPath}.${childField.name}`);
      }
      return;
    }
    if (dataType.type === 'decimal') {
      if (typeof value !== 'number' && typeof value !== 'bigint') {
        throw createFeatureValueTypeError(fieldPath, 'a decimal number');
      }
      return;
    }
    if (dataType.type === 'fixed-size-binary') {
      const byteLength = getByteLength(value);
      if (byteLength !== dataType.byteWidth) {
        throw createFeatureValueTypeError(fieldPath, `exactly ${dataType.byteWidth} bytes`);
      }
      return;
    }
    // Keep future Arrow composites explicit until a lossless runtime mapping is defined.
    throw new TileConversionError(
      'FEATURE_VALUE_MAPPING_UNSUPPORTED',
      `Arrow schema type "${dataType.type}" has no feature value mapping for "${fieldPath}"`
    );
  }

  if (isIntegerDataType(dataType)) {
    if (!isIntegerIdentifier(value)) {
      throw createFeatureValueTypeError(fieldPath, 'an integer');
    }
    const [minimum, maximum] = getIntegerBounds(dataType);
    const integerValue = typeof value === 'bigint' ? value : BigInt(value);
    if (integerValue < minimum || integerValue > maximum) {
      throw new TileConversionError(
        'FEATURE_VALUE_OUT_OF_RANGE',
        `Value for Arrow field "${fieldPath}" is outside the range of ${dataType}`
      );
    }
    return;
  }
  if (dataType === 'utf8' || dataType === 'utf8-view') {
    if (typeof value !== 'string') throw createFeatureValueTypeError(fieldPath, 'a string');
    return;
  }
  if (dataType === 'bool') {
    if (typeof value !== 'boolean') throw createFeatureValueTypeError(fieldPath, 'a boolean');
    return;
  }
  if (dataType === 'binary' || dataType === 'binary-view') {
    if (getByteLength(value) < 0) throw createFeatureValueTypeError(fieldPath, 'binary data');
    return;
  }
  if (
    dataType === 'float' ||
    dataType === 'float16' ||
    dataType === 'float32' ||
    dataType === 'float64'
  ) {
    if (typeof value !== 'number') throw createFeatureValueTypeError(fieldPath, 'a number');
    return;
  }
  if (dataType === 'null') {
    throw createFeatureValueTypeError(fieldPath, 'null');
  }
  if (
    dataType === 'date-day' ||
    dataType === 'date-millisecond' ||
    dataType.startsWith('timestamp-')
  ) {
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw createFeatureValueTypeError(fieldPath, 'a valid Date');
    }
    return;
  }
  throw new TileConversionError(
    'FEATURE_VALUE_MAPPING_UNSUPPORTED',
    `Arrow schema type "${dataType}" has no feature value mapping for "${fieldPath}"`
  );
}

/** Checks whether a feature identifier is exact enough for an integer Arrow field. */
function isIntegerIdentifier(value: unknown): value is number | bigint {
  return typeof value === 'bigint' || (typeof value === 'number' && Number.isSafeInteger(value));
}

/** Identifies all Arrow integer primitive types accepted for feature identifiers. */
function isIntegerDataType(dataType?: DataType): boolean {
  return (
    dataType === 'int' ||
    dataType === 'int8' ||
    dataType === 'int16' ||
    dataType === 'int32' ||
    dataType === 'int64' ||
    dataType === 'uint8' ||
    dataType === 'uint16' ||
    dataType === 'uint32' ||
    dataType === 'uint64'
  );
}

/** Returns the inclusive numeric limits for the declared integer field. */
function getIntegerBounds(dataType: DataType): [bigint, bigint] {
  switch (dataType) {
    case 'int8':
      return [-128n, 127n];
    case 'uint8':
      return [0n, 255n];
    case 'int16':
      return [-32768n, 32767n];
    case 'uint16':
      return [0n, 65535n];
    case 'int32':
      return [-2147483648n, 2147483647n];
    case 'uint32':
      return [0n, 4294967295n];
    case 'int64':
      return [-(2n ** 63n), 2n ** 63n - 1n];
    case 'uint64':
      return [0n, 2n ** 64n - 1n];
    default:
      return [-(2n ** 31n), 2n ** 31n - 1n];
  }
}

/** Creates a typed error that names the field whose schema mapping does not match its value. */
function createFeatureValueTypeError(fieldPath: string, expected: string): TileConversionError {
  return new TileConversionError(
    'FEATURE_VALUE_TYPE_MISMATCH',
    `Arrow field "${fieldPath}" requires ${expected}`
  );
}

/** Checks whether a value is a property record rather than an array or scalar. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns the byte length for supported binary value containers. */
function getByteLength(value: unknown): number {
  if (value instanceof Uint8Array) return value.byteLength;
  if (value instanceof ArrayBuffer) return value.byteLength;
  return -1;
}

/** Checks whether the schema type stores opaque bytes without coercion. */
function isBinaryType(dataType?: DataType): boolean {
  return (
    dataType === 'binary' ||
    dataType === 'binary-view' ||
    (typeof dataType === 'object' && dataType.type === 'fixed-size-binary')
  );
}
