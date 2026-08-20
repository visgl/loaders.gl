// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SQLPredicate, SQLPredicateValue} from './sql-predicate-types';

const MAXIMUM_PREDICATE_DEPTH = 64;
const MAXIMUM_PREDICATE_NODES = 4096;

/**
 * JSON Schema for the JSON-serializable portion of the loaders.gl SQL predicate AST.
 *
 * In-process predicates additionally accept `bigint`, `Date`, and `Uint8Array` values, which JSON
 * Schema cannot represent directly.
 */
export const SQL_PREDICATE_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://loaders.gl/schemas/sql-predicate.schema.json',
  title: 'loaders.gl SQL predicate',
  oneOf: [
    {$ref: '#/$defs/comparison'},
    {$ref: '#/$defs/in'},
    {$ref: '#/$defs/isNull'},
    {$ref: '#/$defs/logical'},
    {$ref: '#/$defs/not'}
  ],
  $defs: {
    property: {
      type: 'object',
      required: ['property'],
      properties: {property: {type: 'string', minLength: 1}},
      additionalProperties: false
    },
    value: {type: ['boolean', 'number', 'string']},
    comparison: {
      type: 'object',
      required: ['op', 'args'],
      properties: {
        op: {enum: ['=', '<>', '<', '<=', '>', '>=']},
        args: {
          type: 'array',
          prefixItems: [{$ref: '#/$defs/property'}, {$ref: '#/$defs/value'}],
          minItems: 2,
          maxItems: 2
        }
      },
      additionalProperties: false
    },
    in: {
      type: 'object',
      required: ['op', 'args'],
      properties: {
        op: {const: 'in'},
        args: {
          type: 'array',
          prefixItems: [
            {$ref: '#/$defs/property'},
            {type: 'array', items: {$ref: '#/$defs/value'}, minItems: 1}
          ],
          minItems: 2,
          maxItems: 2
        }
      },
      additionalProperties: false
    },
    isNull: {
      type: 'object',
      required: ['op', 'args'],
      properties: {
        op: {const: 'isNull'},
        args: {
          type: 'array',
          prefixItems: [{$ref: '#/$defs/property'}],
          minItems: 1,
          maxItems: 1
        }
      },
      additionalProperties: false
    },
    logical: {
      type: 'object',
      required: ['op', 'args'],
      properties: {
        op: {enum: ['and', 'or']},
        args: {type: 'array', items: {$ref: '#'}, minItems: 2}
      },
      additionalProperties: false
    },
    not: {
      type: 'object',
      required: ['op', 'args'],
      properties: {
        op: {const: 'not'},
        args: {type: 'array', prefixItems: [{$ref: '#'}], minItems: 1, maxItems: 1}
      },
      additionalProperties: false
    }
  }
} as const;

/** Returns whether an unknown value is a valid portable SQL predicate. */
export function isSQLPredicate(value: unknown): value is SQLPredicate {
  try {
    validateSQLPredicate(value);
    return true;
  } catch {
    return false;
  }
}

/** Validates an unknown portable SQL predicate or throws a path-specific error. */
export function validateSQLPredicate(value: unknown): asserts value is SQLPredicate {
  const state = {nodes: 0};
  validatePredicateNode(value, '$', 0, state);
}

/** Validates one recursive predicate node. */
function validatePredicateNode(
  value: unknown,
  path: string,
  depth: number,
  state: {nodes: number}
): asserts value is SQLPredicate {
  if (depth > MAXIMUM_PREDICATE_DEPTH) {
    throw new Error(`SQL predicate ${path} exceeds the maximum nesting depth`);
  }
  state.nodes++;
  if (state.nodes > MAXIMUM_PREDICATE_NODES) {
    throw new Error('SQL predicate exceeds the maximum node count');
  }
  if (!isRecord(value) || !hasExactKeys(value, ['op', 'args'])) {
    throw new Error(`SQL predicate ${path} must contain only op and args`);
  }
  if (typeof value.op !== 'string' || !Array.isArray(value.args)) {
    throw new Error(`SQL predicate ${path} requires string op and array args`);
  }

  switch (value.op) {
    case 'and':
    case 'or':
      if (value.args.length < 2) {
        throw new Error(`SQL predicate ${path}.${value.op} requires at least two arguments`);
      }
      for (let index = 0; index < value.args.length; index++) {
        validatePredicateNode(value.args[index], `${path}.args[${index}]`, depth + 1, state);
      }
      return;
    case 'not':
      if (value.args.length !== 1) {
        throw new Error(`SQL predicate ${path}.not requires exactly one argument`);
      }
      validatePredicateNode(value.args[0], `${path}.args[0]`, depth + 1, state);
      return;
    case 'isNull':
      if (value.args.length !== 1) {
        throw new Error(`SQL predicate ${path}.isNull requires exactly one argument`);
      }
      validatePredicateProperty(value.args[0], `${path}.args[0]`);
      return;
    case 'in':
      if (value.args.length !== 2 || !Array.isArray(value.args[1]) || value.args[1].length === 0) {
        throw new Error(`SQL predicate ${path}.in requires a property and non-empty value list`);
      }
      validatePredicateProperty(value.args[0], `${path}.args[0]`);
      value.args[1].forEach((item, index) =>
        validatePredicateValue(item, `${path}.args[1][${index}]`)
      );
      return;
    case '=':
    case '<>':
    case '<':
    case '<=':
    case '>':
    case '>=':
      if (value.args.length !== 2) {
        throw new Error(`SQL predicate ${path}.${value.op} requires exactly two arguments`);
      }
      validatePredicateProperty(value.args[0], `${path}.args[0]`);
      validatePredicateValue(value.args[1], `${path}.args[1]`);
      return;
    default:
      throw new Error(`SQL predicate ${path} has unsupported operator ${JSON.stringify(value.op)}`);
  }
}

/** Validates one property reference. */
function validatePredicateProperty(value: unknown, path: string): void {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['property']) ||
    typeof value.property !== 'string' ||
    value.property.length === 0
  ) {
    throw new Error(`SQL predicate ${path} requires a non-empty property reference`);
  }
}

/** Validates one structured-cloneable predicate scalar. */
function validatePredicateValue(value: unknown, path: string): asserts value is SQLPredicateValue {
  if (
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'string' ||
    value instanceof Uint8Array
  ) {
    return;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return;
  }
  throw new Error(`SQL predicate ${path} contains an unsupported scalar value`);
}

/** Returns whether an unknown value is a non-null object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns whether an object contains exactly the expected enumerable keys. */
function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && expectedKeys.every(key => keys.includes(key));
}
