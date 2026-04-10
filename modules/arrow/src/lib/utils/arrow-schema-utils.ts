// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/**
 * Options controlling Arrow table schema validation.
 */
export type ValidateArrowTableSchemaOptions = {
  /** Reject fields that are present in the table but not in the expected schema. */
  rejectExtraFields?: boolean;
  /** Human-readable schema name included in validation errors. */
  schemaName?: string;
};

/**
 * Formats an Arrow field list for validation error messages.
 */
function formatSchemaFieldNames(fields: arrow.Field[]): string {
  return fields.map(field => field.name).join(', ');
}

/**
 * Validates that an Arrow table matches an expected schema by field order, field name, Arrow type,
 * and field nullability.
 *
 * Extra trailing fields are accepted by default so clients can tolerate additive schema changes.
 * Set `rejectExtraFields` to require an exact field count.
 *
 * @typeParam T - Expected Arrow schema type map.
 * @param table - Arrow table to validate.
 * @param expectedSchema - Expected Arrow schema.
 * @param options - Validation behavior and error-message options.
 * @returns The input table narrowed to `arrow.Table<T>` when validation passes.
 */
export function validateArrowTableSchema<T extends arrow.TypeMap>(
  table: arrow.Table,
  expectedSchema: arrow.Schema<T>,
  options: ValidateArrowTableSchemaOptions = {}
): arrow.Table<T> {
  const {rejectExtraFields = false, schemaName} = options;
  const schemaPrefix = schemaName
    ? `Unexpected Arrow schema for ${schemaName}: `
    : 'Unexpected Arrow schema: ';
  const fieldCountError = getFieldCountValidationError(
    table.schema.fields,
    expectedSchema.fields,
    rejectExtraFields,
    schemaPrefix
  );

  if (fieldCountError) {
    throw new Error(fieldCountError);
  }

  for (let fieldIndex = 0; fieldIndex < expectedSchema.fields.length; fieldIndex++) {
    const expected = expectedSchema.fields[fieldIndex];
    const actual = table.schema.fields[fieldIndex];
    if (!expected || !actual) {
      throw new Error(`${schemaPrefix}missing field at index ${fieldIndex}`);
    }
    if (expected.name !== actual.name) {
      throw new Error(
        `${schemaPrefix}at index ${fieldIndex}: expected field ${expected.name}, got ${actual.name}`
      );
    }
    if (expected.type.typeId !== actual.type.typeId) {
      throw new Error(getFieldTypeValidationError(expected, actual, schemaPrefix));
    }
    if (expected.type.toString() !== actual.type.toString()) {
      throw new Error(getFieldTypeValidationError(expected, actual, schemaPrefix));
    }
    if (expected.nullable !== actual.nullable) {
      throw new Error(
        `${schemaPrefix}${expected.name}: expected nullable=${expected.nullable}, got nullable=${actual.nullable}`
      );
    }
  }

  return table as arrow.Table<T>;
}

/**
 * Builds a detailed field type validation error for an Arrow field mismatch.
 */
function getFieldTypeValidationError(
  expectedField: arrow.Field,
  actualField: arrow.Field,
  schemaPrefix: string
): string {
  return (
    `${schemaPrefix}${expectedField.name}: expected type ${expectedField.type.toString()} ` +
    `(type id ${expectedField.type.typeId}), got ${actualField.type.toString()} ` +
    `(type id ${actualField.type.typeId})`
  );
}

/**
 * Builds a detailed field count validation error when the table has missing or unexpected fields.
 */
function getFieldCountValidationError(
  actualFields: arrow.Field[],
  expectedFields: arrow.Field[],
  rejectExtraFields: boolean,
  schemaPrefix: string
): string | null {
  const actualFieldCount = actualFields.length;
  const expectedFieldCount = expectedFields.length;

  if (
    actualFieldCount >= expectedFieldCount &&
    (!rejectExtraFields || actualFieldCount === expectedFieldCount)
  ) {
    return null;
  }

  const expectedFieldNames = expectedFields.map(field => field.name);
  const actualFieldNames = actualFields.map(field => field.name);
  const actualFieldNameSet = new Set(actualFieldNames);
  const expectedFieldNameSet = new Set(expectedFieldNames);
  const missingFieldNames = expectedFieldNames.filter(
    fieldName => !actualFieldNameSet.has(fieldName)
  );
  const unexpectedFieldNames = actualFieldNames.filter(
    fieldName => !expectedFieldNameSet.has(fieldName)
  );

  return (
    `${schemaPrefix}expected ${expectedFieldCount} fields, got ${actualFieldCount}. ` +
    `Missing fields: ${missingFieldNames.length > 0 ? missingFieldNames.join(', ') : '(none)'}. ` +
    `Unexpected fields: ${
      unexpectedFieldNames.length > 0 ? unexpectedFieldNames.join(', ') : '(none)'
    }. ` +
    `Expected fields: ${formatSchemaFieldNames(expectedFields)}. ` +
    `Actual fields: ${formatSchemaFieldNames(actualFields)}.`
  );
}
