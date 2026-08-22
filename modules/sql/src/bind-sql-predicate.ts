// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {validateSQLPredicate} from './sql-predicate-schema';
import {
  isSQLPredicateParameter,
  type SQLPredicate,
  type SQLPredicateParameterValues,
  type SQLPredicateScalar,
  type SQLPredicateValue
} from './sql-predicate-types';

/** Binds named parameter references in a portable SQL predicate without mutating the input AST. */
export function bindSQLPredicate(
  predicate: SQLPredicate,
  parameters: SQLPredicateParameterValues
): SQLPredicate {
  validateSQLPredicate(predicate);
  return bindPredicate(predicate, parameters);
}

/** Returns a predicate copy with every parameter reference replaced by its caller-supplied scalar. */
function bindPredicate(
  predicate: SQLPredicate,
  parameters: SQLPredicateParameterValues
): SQLPredicate {
  switch (predicate.op) {
    case 'and':
    case 'or':
      return {
        op: predicate.op,
        args: predicate.args.map(child => bindPredicate(child, parameters))
      };
    case 'not':
      return {op: 'not', args: [bindPredicate(predicate.args[0], parameters)]};
    case 'isNull':
      return {op: 'isNull', args: [{property: predicate.args[0].property}]};
    case 'in':
      return {
        op: 'in',
        args: [
          {property: predicate.args[0].property},
          predicate.args[1].map(value => bindPredicateValue(value, parameters))
        ]
      };
    default:
      return {
        op: predicate.op,
        args: [
          {property: predicate.args[0].property},
          bindPredicateValue(predicate.args[1], parameters)
        ]
      };
  }
}

/** Resolves one scalar or named parameter reference into a concrete SQL predicate scalar. */
function bindPredicateValue(
  value: SQLPredicateValue,
  parameters: SQLPredicateParameterValues
): SQLPredicateScalar {
  if (!isSQLPredicateParameter(value)) {
    return value;
  }
  if (!Object.hasOwn(parameters, value.parameter)) {
    throw new Error(`SQL predicate parameter ":${value.parameter}" requires a value`);
  }
  const parameterValue = parameters[value.parameter];
  validatePredicateParameterValue(parameterValue, value.parameter);
  return parameterValue;
}

/** Validates a caller-supplied parameter as a concrete predicate scalar. */
function validatePredicateParameterValue(
  value: unknown,
  parameterName: string
): asserts value is SQLPredicateScalar {
  if (isSQLPredicateParameter(value)) {
    throw new Error(
      `SQL predicate parameter ":${parameterName}" cannot reference another parameter`
    );
  }
  try {
    validateSQLPredicate({op: '=', args: [{property: '_'}, value]});
  } catch {
    throw new Error(`SQL predicate parameter ":${parameterName}" has an unsupported value`);
  }
}
