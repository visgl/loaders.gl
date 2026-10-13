// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {constants} from 'node:fs';
import {open} from 'node:fs/promises';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {NodeTileConversionOptions} from './node-conversion.js';

/** Maximum bytes retained for a local declarative feature mapping. */
const MAXIMUM_SCHEMA_BYTES = 64 * 1024;
/** Scalar storage types shared by the qualified mesh feature readers and writers. */
const FIELD_TYPES = [
  'int8',
  'uint8',
  'int16',
  'uint16',
  'int32',
  'uint32',
  'int64',
  'uint64',
  'float32',
  'float64',
  'utf8'
];

/** Reads a bounded local JSON mapping; source/destination adapters validate data semantics. */
export async function readFeatureSchema(
  path: string,
  i3s: boolean,
  signal?: AbortSignal
): Promise<Pick<NodeTileConversionOptions, 'features' | 'i3sFeatures'>> {
  signal?.throwIfAborted();
  // Avoid blocking on special files before the regular-file check.
  const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  let mapping: unknown;
  try {
    if (!(await file.stat()).isFile()) rejectSchema('Feature schema must be a regular local file');
    const bytes = new Uint8Array(MAXIMUM_SCHEMA_BYTES + 1);
    let length = 0;
    while (length < bytes.length) {
      signal?.throwIfAborted();
      const {bytesRead} = await file.read(bytes, length, bytes.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    signal?.throwIfAborted();
    if (length > MAXIMUM_SCHEMA_BYTES) rejectSchema('Feature schema exceeds 64 KiB');
    try {
      mapping = JSON.parse(
        new TextDecoder('utf-8', {fatal: true}).decode(bytes.subarray(0, length))
      );
    } catch {
      rejectSchema('Feature schema must contain valid UTF-8 JSON');
    }
  } finally {
    await file.close();
  }
  const options = requireRecord(mapping);
  rejectUnknownKeys(options, [
    'schema',
    'metadataClass',
    'sourceFeatureIdProperty',
    'featureIdField',
    'batchSize',
    'integer64Encoding',
    ...(i3s ? ['objectIdProperty', 'maxAttributeBytes'] : [])
  ]);
  requireName(options.metadataClass);
  for (const key of ['sourceFeatureIdProperty', 'featureIdField']) {
    if (options[key] !== undefined) requireName(options[key]);
  }
  if (
    options.batchSize !== undefined &&
    (!Number.isSafeInteger(options.batchSize) ||
      Number(options.batchSize) < 1 ||
      Number(options.batchSize) > 65536)
  )
    rejectSchema('batchSize must be an integer from 1 to 65536');
  if (options.integer64Encoding !== undefined && options.integer64Encoding !== 'decimal-string')
    rejectSchema('integer64Encoding must be decimal-string when supplied');
  const schema = requireRecord(options.schema);
  rejectUnknownKeys(schema, ['fields', 'metadata']);
  validateMetadata(schema.metadata);
  if (!Array.isArray(schema.fields) || !schema.fields.length || schema.fields.length > 256)
    rejectSchema('schema.fields must declare between 1 and 256 fields');
  const names = new Set<string>();
  for (const value of schema.fields) {
    const field = requireRecord(value);
    rejectUnknownKeys(field, ['name', 'type', 'nullable', 'metadata']);
    requireName(field.name);
    if (names.has(field.name as string)) rejectSchema('Feature fields must have unique names');
    names.add(field.name as string);
    if (
      typeof field.type !== 'string' ||
      !FIELD_TYPES.includes(field.type) ||
      (field.nullable !== undefined && typeof field.nullable !== 'boolean')
    )
      rejectSchema('Fields require a scalar numeric/utf8 type and an optional boolean nullable');
    validateMetadata(field.metadata);
  }
  const identifier = schema.fields.find(
    value => value.name === (options.featureIdField ?? 'feature_id')
  );
  if (
    !identifier ||
    identifier.nullable === true ||
    !['utf8', ...FIELD_TYPES.filter(type => /^(u?int)/.test(type))].includes(identifier.type)
  )
    rejectSchema('Declare a nonnullable string or integer feature ID field');
  if (i3s) {
    requireName(options.objectIdProperty);
    if (
      !Number.isSafeInteger(options.maxAttributeBytes) ||
      Number(options.maxAttributeBytes) < 1 ||
      Number(options.maxAttributeBytes) > 16 * 1024 * 1024
    )
      rejectSchema('maxAttributeBytes must be a positive integer at most 16 MiB');
    return {
      i3sFeatures: options as unknown as NonNullable<NodeTileConversionOptions['i3sFeatures']>
    };
  }
  return {features: options as unknown as NonNullable<NodeTileConversionOptions['features']>};
}

/** Rejects unknown configuration keys rather than silently ignoring misspelled controls. */
function rejectUnknownKeys(record: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(record).some(key => !allowed.includes(key)))
    rejectSchema('Unknown feature-schema option');
}

/** Requires a JSON object before accessing its fields. */
function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    rejectSchema('Feature mappings require JSON objects');
  return value as Record<string, unknown>;
}

/** Requires a nonempty class, property or column name. */
function requireName(value: unknown): void {
  if (typeof value !== 'string' || !value.trim())
    rejectSchema('Feature names must be nonempty strings');
}

/** Retains only string-valued schema/field metadata. */
function validateMetadata(value: unknown): void {
  if (value === undefined) return;
  if (Object.values(requireRecord(value)).some(entry => typeof entry !== 'string'))
    rejectSchema('Schema metadata values must be strings');
}

/** Reports configuration failures before source conversion or output publication. */
function rejectSchema(message: string): never {
  throw new TileConversionError('CLI_FEATURE_SCHEMA_INVALID', message);
}
