// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {ArrowTableBatch, Field} from '@loaders.gl/schema';

/** One feature table with an explicit triangle-to-row association. */
export interface I3SMeshFeatures {
  /** Explicit-schema Arrow batches for a single metadata class, in row order. */
  readonly batches: readonly ArrowTableBatch[];
  /** One zero-based table row per triangle, in the original index/vertex order. */
  readonly triangleFeatureIndices: Uint32Array;
  /** Non-null stable identifier column; geometry uses separate local OIDs. */
  readonly featureIdField: string;
  /** Explicit authorization to represent int64/uint64 values as exact decimal strings. */
  readonly integer64Encoding?: 'decimal-string';
}

/** Binary attribute resources and their target schema. */
export interface EncodedI3SMeshAttributes {
  /** Total number of features, including rows with no geometry (rejected by the mesh writer). */
  readonly count: number;
  /** GZIP is applied by the layer writer after these buffers are encoded. */
  readonly buffers: readonly ArrayBuffer[];
  /** Scene-layer fields in the same order as storage descriptors. */
  readonly fields: readonly object[];
  /** Layout of each binary attribute resource. */
  readonly storage: readonly object[];
  /** Fields explicitly mapped from 64-bit integer to decimal text. */
  readonly decimalStringFields: readonly string[];
}

/** Encodes scalar Arrow features with explicit null and 64-bit policies, without coercion. */
export function encodeI3SMeshAttributes(
  features: I3SMeshFeatures | undefined,
  maxResourceBytes: number
): EncodedI3SMeshAttributes {
  const batches = features?.batches || [];
  const schema = batches[0]?.schema;
  const count = batches.reduce((total, batch) => total + batch.data.numRows, 0);
  if (features && (!schema || count === 0 || !schema.fields.length)) {
    throw new Error('I3S features require nonempty explicit-schema Arrow batches');
  }
  if (!Number.isSafeInteger(count) || count > Math.floor((maxResourceBytes - 4) / 4))
    throw new Error('I3S object IDs exceed maxResourceBytes');
  if (
    schema &&
    new Set(schema.fields.map(field => field.name.toUpperCase())).size !== schema.fields.length
  )
    throw new Error('I3S fields must have unique names ignoring case');
  const fields: object[] = [{name: 'OBJECTID', alias: 'OBJECTID', type: 'esriFieldTypeOID'}];
  const storage: object[] = [makeStorage('f_0', 'OBJECTID', 'Oid32')];
  const buffers: ArrayBuffer[] = [
    encodeNumericValues(
      Array.from({length: count}, (_, index) => index),
      'uint32',
      maxResourceBytes
    )
  ];
  const decimalStringFields: string[] = [];
  if (!schema || !features) return {count, fields, storage, buffers, decimalStringFields};
  if (
    !schema.fields.some(field => field.name === features.featureIdField && field.nullable !== true)
  ) {
    throw new Error('I3S features require a declared non-null stable identifier column');
  }
  const identifiers = new Set<string | number | bigint>();
  for (const batch of batches) {
    if (
      JSON.stringify(batch.schema) !== JSON.stringify(schema) ||
      batch.length !== batch.data.numRows
    ) {
      throw new Error('I3S feature batches must share an explicit schema and correct row counts');
    }
    const actualFields = convertArrowToSchema(batch.data.schema).fields;
    if (
      JSON.stringify(actualFields.map(field => [field.name, field.type])) !==
      JSON.stringify(schema.fields.map(field => [field.name, field.type]))
    )
      throw new Error('I3S declared feature schema must match the Arrow column types');
    const column = batch.data.getChild(features.featureIdField);
    if (!column) throw new Error('Missing Arrow feature identifier column');
    for (let index = 0; index < column.length; index++) {
      const identifier = column.get(index);
      if (
        !(
          typeof identifier === 'string' ||
          typeof identifier === 'bigint' ||
          Number.isSafeInteger(identifier)
        ) ||
        identifiers.has(identifier)
      ) {
        throw new Error('I3S stable identifiers must be unique strings or exact integers');
      }
      identifiers.add(identifier);
    }
  }
  for (const field of schema.fields) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.name) || field.name.toUpperCase() === 'OBJECTID') {
      throw new Error('I3S fields require unique identifiers other than reserved OBJECTID');
    }
    const values = batches.flatMap(batch => {
      const column = batch.data.getChild(field.name);
      if (!column) throw new Error(`Missing Arrow column ${field.name}`);
      return Array.from({length: column.length}, (_, index) => column.get(index));
    });
    if (field.nullable !== true && values.some(value => value === null))
      throw new Error('I3S non-nullable fields must not contain null values');
    if (!['utf8', 'int32', 'float64', 'int64', 'uint64'].includes(String(field.type)))
      throw new Error('Unsupported I3S scalar property type');
    const isInteger64 = field.type === 'int64' || field.type === 'uint64';
    const isString = field.type === 'utf8' || isInteger64;
    if (isInteger64 && features.integer64Encoding !== 'decimal-string') {
      throw new Error('I3S int64/uint64 fields require explicit decimal-string encoding');
    }
    if (isInteger64 && values.some(value => value !== null && typeof value !== 'bigint'))
      throw new Error('I3S 64-bit attributes require exact bigint values');
    const buffer = isString
      ? encodeStringValues(
          values.map(value => (isInteger64 && value !== null ? String(value) : value)),
          maxResourceBytes
        )
      : encodeNumericValues(values, field.type, maxResourceBytes);
    const valueType = isString ? 'String' : field.type === 'int32' ? 'Int32' : 'Float64';
    if (isInteger64) decimalStringFields.push(field.name);
    fields.push({
      name: field.name,
      alias: field.name,
      type: isString
        ? 'esriFieldTypeString'
        : field.type === 'int32'
          ? 'esriFieldTypeInteger'
          : 'esriFieldTypeDouble'
    });
    storage.push(makeStorage(`f_${buffers.length}`, field.name, valueType));
    buffers.push(buffer);
  }
  return {count, fields, storage, buffers, decimalStringFields};
}

/** Encodes UTF-8 with zero byte counts for null and one terminator byte for an empty string. */
function encodeStringValues(values: readonly unknown[], maxBytes: number): ArrayBuffer {
  const encoder = new TextEncoder();
  let byteLength = 8 + 4 * values.length;
  for (const value of values) {
    if (
      value !== null &&
      (typeof value !== 'string' ||
        value.includes('\0') ||
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value))
    ) {
      throw new Error('I3S strings must contain valid Unicode without embedded nulls');
    }
    byteLength += value === null ? 0 : encoder.encode(value as string).byteLength + 1;
  }
  if (byteLength > maxBytes) throw new Error('I3S attribute exceeds maxResourceBytes');
  const bytes = new Uint8Array(byteLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, values.length, true);
  view.setUint32(4, byteLength - 8 - 4 * values.length, true);
  let offset = 8 + 4 * values.length;
  for (const [index, value] of values.entries()) {
    const encoded = value === null ? new Uint8Array(0) : encoder.encode(`${value}\0`);
    view.setUint32(8 + 4 * index, encoded.length, true);
    bytes.set(encoded, offset);
    offset += encoded.length;
  }
  return bytes.buffer;
}

/** Encodes supported non-null numeric scalars with the I3S alignment and little-endian layout. */
function encodeNumericValues(
  values: readonly unknown[],
  type: Field['type'],
  maxBytes: number
): ArrayBuffer {
  if (type !== 'int32' && type !== 'uint32' && type !== 'float64') {
    throw new Error(
      'I3S feature properties support utf8, int32, float64, and explicitly mapped int64/uint64'
    );
  }
  const width = type === 'float64' ? 8 : 4;
  const byteLength = width + width * values.length;
  if (byteLength > maxBytes) throw new Error('I3S attribute exceeds maxResourceBytes');
  const output = new ArrayBuffer(byteLength);
  const view = new DataView(output);
  view.setUint32(0, values.length, true);
  for (const [index, value] of values.entries()) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      (type !== 'float64' &&
        (!Number.isInteger(value) ||
          value < (type === 'int32' ? -2147483648 : 0) ||
          value > (type === 'int32' ? 2147483647 : 4294967295)))
    ) {
      throw new Error('I3S numeric attributes require finite, non-null, in-range values');
    }
    const offset = width + width * index;
    if (type === 'float64') view.setFloat64(offset, value, true);
    else if (type === 'int32') view.setInt32(offset, value, true);
    else view.setUint32(offset, value, true);
  }
  return output;
}

/** Creates the standard scalar/string storage descriptor for an attribute resource. */
function makeStorage(key: string, name: string, valueType: string): object {
  return {
    key,
    name,
    header: [
      {property: 'count', valueType: 'UInt32'},
      ...(valueType === 'String'
        ? [{property: 'attributeValuesByteCount', valueType: 'UInt32'}]
        : [])
    ],
    ordering:
      valueType === 'String' ? ['attributeByteCounts', 'attributeValues'] : ['attributeValues'],
    ...(valueType === 'String'
      ? {attributeByteCounts: {valueType: 'UInt32', valuesPerElement: 1}}
      : {}),
    attributeValues: {
      valueType,
      valuesPerElement: 1,
      ...(valueType === 'String' ? {encoding: 'UTF-8'} : {})
    }
  };
}
