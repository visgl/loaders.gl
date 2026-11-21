// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  validateSQLPredicate as validateMathSQLPredicate,
  type SQLPredicate as MathSQLPredicate
} from '@math.gl/sql/parser';
import type {SQLPredicate} from './sql-predicate-types';

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
      properties: {
        property: {type: 'string', minLength: 1},
        quoted: {type: 'boolean'}
      },
      additionalProperties: false
    },
    value: {
      oneOf: [
        {type: ['boolean', 'number', 'string']},
        {
          type: 'object',
          required: ['parameter'],
          properties: {parameter: {type: 'string', minLength: 1}},
          additionalProperties: false
        }
      ]
    },
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
  validateMathSQLPredicate(value);
  rejectPredicateCasts(value, '$');
}

/** Rejects casts after math.gl has validated the structure and bounded its depth. */
function rejectPredicateCasts(predicate: MathSQLPredicate, path: string): void {
  if (predicate.op === 'and' || predicate.op === 'or' || predicate.op === 'not') {
    predicate.args.forEach((child, index) =>
      rejectPredicateCasts(child, path + '.args[' + index + ']')
    );
  } else if (Object.hasOwn(predicate.args[0], 'casts')) {
    throw new Error('SQL predicate ' + path + '.args[0] requires a non-empty property reference');
  }
}
