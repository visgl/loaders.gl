// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {queryArrowSQL} from '@loaders.gl/core/query/arrow-query';
import {queryGroupedSQL} from '@loaders.gl/core/query';
import {tableFromArrays} from 'apache-arrow';
import {expect, test} from 'vitest';

const data = tableFromArrays({id: [1, 2, 3, 4], value: [10, 10, 30, 0]});
const catalog = new Map([
  ['data', data],
  ['keys', tableFromArrays({key: [2, 2]})]
]);

test('Arrow SQL applies HAVING and hidden aggregate ordering to computed groups', () => {
  const result = queryArrowSQL(
    'SELECT value / 10 AS bucket, COUNT(*) AS total FROM data GROUP BY 1 HAVING SUM(value) > 15 ORDER BY SUM(value) DESC',
    catalog
  );
  expect(result.schema.names).toEqual(['bucket', 'total']);
  expect(Array.from(result.getChild('bucket')!)).toEqual([3, 1]);
  expect(Array.from(result.getChild('total')!, Number)).toEqual([1, 2]);
});

test.each([
  ['SEMI', [2]],
  ['ANTI', [1, 3, 4]]
])('Arrow SQL executes %s JOIN with left-only output and duplicate right keys', (join, ids) => {
  const result = queryArrowSQL(`SELECT * FROM data ${join} JOIN keys ON id = key`, catalog);
  expect(result.schema.names).toEqual(['id', 'value']);
  expect(Array.from(result.getChild('id')!)).toEqual(ids);
});

test('the streaming grouped helper rejects HAVING instead of ignoring it', async () => {
  await expect(
    queryGroupedSQL('SELECT value, COUNT(*) AS total FROM data GROUP BY value HAVING total > 1', {
      source: data
    })
  ).rejects.toThrow('Expected a single-source, single-key GROUP BY query');
});
