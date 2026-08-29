// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const PRIMITIVE_TYPES = new Set([
  'null',
  'boolean',
  'int',
  'long',
  'float',
  'double',
  'bytes',
  'string'
]);
const NAMED_TYPES = new Set(['record', 'enum', 'fixed']);

/** Parses and validates a standalone Avro JSON schema. */
export function parseAvroSchema(text: string): unknown {
  let schema: unknown;
  try {
    schema = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Invalid Avro schema JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  validateSchema(schema, new Set<string>(), '$');
  return schema;
}

/** Validates an Avro schema and tracks named definitions. */
function validateSchema(schema: unknown, names: Set<string>, path: string): void {
  if (typeof schema === 'string') {
    if (!PRIMITIVE_TYPES.has(schema) && !names.has(schema)) {
      throw new Error(`Invalid Avro schema at ${path}: unknown type "${schema}"`);
    }
    return;
  }
  if (Array.isArray(schema)) {
    if (schema.length === 0) throw new Error(`Invalid Avro schema at ${path}: empty union`);
    schema.forEach((branch, index) => validateSchema(branch, names, `${path}[${index}]`));
    return;
  }
  if (!schema || typeof schema !== 'object') {
    throw new Error(`Invalid Avro schema at ${path}: expected a string, object, or union`);
  }

  const schemaObject = schema as Record<string, unknown>;
  const type = schemaObject.type;
  if (typeof type !== 'string' && !Array.isArray(type) && !type) {
    throw new Error(`Invalid Avro schema at ${path}: missing type`);
  }
  if (Array.isArray(type) || typeof type === 'object') {
    validateSchema(type, names, `${path}.type`);
    return;
  }
  const schemaType = type as string;
  if (PRIMITIVE_TYPES.has(schemaType)) return;
  if (schemaType === 'array') {
    validateSchema(schemaObject.items, names, `${path}.items`);
    return;
  }
  if (schemaType === 'map') {
    validateSchema(schemaObject.values, names, `${path}.values`);
    return;
  }
  if (!NAMED_TYPES.has(schemaType)) {
    if (!names.has(schemaType))
      throw new Error(`Invalid Avro schema at ${path}: unknown type "${schemaType}"`);
    return;
  }

  const name = schemaObject.name;
  if (typeof name !== 'string' || !isValidName(name)) {
    throw new Error(`Invalid Avro schema at ${path}: invalid or missing name`);
  }
  names.add(name);
  if (schemaType === 'record') {
    if (!Array.isArray(schemaObject.fields)) {
      throw new Error(`Invalid Avro schema at ${path}.fields: expected an array`);
    }
    for (const [index, field] of schemaObject.fields.entries()) {
      if (
        !field ||
        typeof field !== 'object' ||
        typeof (field as Record<string, unknown>).name !== 'string'
      ) {
        throw new Error(`Invalid Avro schema at ${path}.fields[${index}]: invalid field`);
      }
      validateSchema(
        (field as Record<string, unknown>).type,
        names,
        `${path}.fields[${index}].type`
      );
      if (Object.prototype.hasOwnProperty.call(field, 'default'))
        validateDefault(
          (field as Record<string, unknown>).default,
          (field as Record<string, unknown>).type,
          names,
          `${path}.fields[${index}].default`
        );
    }
  } else if (type === 'enum') {
    if (
      !Array.isArray(schemaObject.symbols) ||
      schemaObject.symbols.some(symbol => typeof symbol !== 'string')
    ) {
      throw new Error(`Invalid Avro schema at ${path}.symbols: expected an array of strings`);
    }
  } else if (
    typeof schemaObject.size !== 'number' ||
    !Number.isInteger(schemaObject.size) ||
    schemaObject.size < 0
  ) {
    throw new Error(`Invalid Avro schema at ${path}.size: expected a non-negative integer`);
  }
}

/** Validates an Avro field default against its schema. */
function validateDefault(value: unknown, schema: unknown, names: Set<string>, path: string): void {
  if (typeof schema === 'string') {
    if (names.has(schema)) return;
    switch (schema) {
      case 'null':
        if (value !== null) throw new Error(`Invalid Avro default at ${path}: expected null`);
        return;
      case 'boolean':
        if (typeof value !== 'boolean')
          throw new Error(`Invalid Avro default at ${path}: expected boolean`);
        return;
      case 'int':
      case 'long':
      case 'float':
      case 'double':
        if (typeof value !== 'number' || !Number.isFinite(value))
          throw new Error(`Invalid Avro default at ${path}: expected number`);
        if ((schema === 'int' || schema === 'long') && !Number.isInteger(value))
          throw new Error(`Invalid Avro default at ${path}: expected integer`);
        return;
      case 'bytes':
      case 'string':
        if (typeof value !== 'string')
          throw new Error(`Invalid Avro default at ${path}: expected string`);
        return;
      default:
        return;
    }
  }
  if (Array.isArray(schema)) {
    if (schema.length === 0) throw new Error(`Invalid Avro default at ${path}: empty union`);
    validateDefault(value, schema[0], names, `${path}[0]`);
    return;
  }
  if (!schema || typeof schema !== 'object')
    throw new Error(`Invalid Avro default at ${path}: invalid schema`);
  const schemaObject = schema as Record<string, unknown>;
  const type = schemaObject.type;
  if (Array.isArray(type) || typeof type === 'object') {
    validateDefault(value, type, names, `${path}.type`);
    return;
  }
  if (typeof type !== 'string') throw new Error(`Invalid Avro default at ${path}: missing type`);
  if (PRIMITIVE_TYPES.has(type)) {
    validateDefault(value, type, names, path);
    return;
  }
  switch (type) {
    case 'array':
      if (!Array.isArray(value)) throw new Error(`Invalid Avro default at ${path}: expected array`);
      for (const [index, item] of value.entries())
        validateDefault(item, schemaObject.items, names, `${path}[${index}]`);
      return;
    case 'map':
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error(`Invalid Avro default at ${path}: expected object map`);
      for (const [key, item] of Object.entries(value))
        validateDefault(item, schemaObject.values, names, `${path}.${key}`);
      return;
    case 'record': {
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error(`Invalid Avro default at ${path}: expected record object`);
      const record = value as Record<string, unknown>;
      for (const field of (schemaObject.fields as unknown[] | undefined) || []) {
        const fieldObject = field as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(record, fieldObject.name as string))
          validateDefault(
            record[fieldObject.name as string],
            fieldObject.type,
            names,
            `${path}.${String(fieldObject.name)}`
          );
      }
      return;
    }
    case 'enum':
      if (
        typeof value !== 'string' ||
        !(schemaObject.symbols as unknown[] | undefined)?.includes(value)
      )
        throw new Error(`Invalid Avro default at ${path}: unknown enum symbol`);
      return;
    case 'fixed':
      if (typeof value !== 'string')
        throw new Error(`Invalid Avro default at ${path}: expected string`);
      return;
    default:
      if (!names.has(type))
        throw new Error(`Invalid Avro default at ${path}: unknown type "${type}"`);
  }
}

/** Tests an Avro name according to the name grammar. */
function isValidName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(name);
}
