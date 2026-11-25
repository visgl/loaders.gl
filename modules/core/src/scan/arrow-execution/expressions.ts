// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {compileArrowExpression, compileArrowPredicate} from '@math.gl/sql/arrow';
export {getExpressionColumns, getProjectionColumns} from '@math.gl/sql/expressions';
export {prepareArrowProjection} from '@math.gl/sql/query';

/** Converts typed SELECT items into ordinary SQL CAST expressions. */
export function normalizeTypedProjection(
  query: import('../query').TypedTableQuery | import('@math.gl/sql/parser').TableQuery
): import('@math.gl/sql/parser').TableQuery {
  return {
    ...query,
    select: query.select?.map(item => {
      if (!item || typeof item !== 'object' || !('cast' in item)) return item;
      if (
        typeof item.column !== 'string' ||
        !/^(?:float(?:16|32|64)|u?int(?:8|16|32|64))$/.test(item.cast) ||
        Object.keys(item).some(key => !['column', 'cast', 'as'].includes(key))
      ) {
        throw new Error('Invalid typed SELECT item.');
      }
      return {
        as: item.as ?? item.column,
        expression: {
          type: 'CallExpression',
          callee: {type: 'Identifier', name: 'cast'},
          arguments: [
            {type: 'Identifier', name: item.column},
            {type: 'Literal', value: item.cast, raw: JSON.stringify(item.cast)}
          ]
        }
      };
    })
  };
}
