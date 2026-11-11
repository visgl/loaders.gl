// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {query} from '@loaders.gl/core/scan';
import {JSONTableLoader, JSONTableSource, JSONTableSourceLoader} from '@loaders.gl/tables/json';

test('JSON table source queries inferred array columns from a URL', async () => {
  expect(JSONTableLoader.options.json.shape).toBe('arrow-table');
  const fetch = vi.fn(async () => new Response('[[-73.98,40.73,2],[-74,40.7,1]]'));
  const result = await query(
    {
      select: [
        {as: 'longitude', column: 'column1'},
        {as: 'latitude', column: 'column2'}
      ],
      where: {op: '=', args: [{property: 'column3'}, 1]},
      limit: 1
    },
    {
      source: 'https://example.test/points.json',
      loaders: JSONTableSourceLoader,
      core: {fetch}
    }
  );

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.shape).toBe('arrow-table');
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['longitude', 'latitude']);
  expect(result.data.get(0)?.toJSON()).toEqual({longitude: -74, latitude: 40.7});
  expect(result.data.numRows).toBe(1);
});

test('JSON table source projects Blob rows and observes cancellation', async () => {
  const source = new JSONTableSource(new Blob(['[{"name":"a","value":1},{"name":"b","value":2}]']));
  const metadata = await source.getQueryMetadata();
  expect(metadata.capabilities.table).toMatchObject({projection: 'residual', streaming: false});

  const batches = [];
  for await (const batch of source.read({
    columns: ['name'],
    predicate: {op: '=', args: [{property: 'value'}, 2]},
    limit: 1
  })) {
    batches.push(batch);
  }
  const [batch] = batches;
  expect(batch?.shape).toBe('arrow-table');
  if (batch?.shape === 'arrow-table') {
    expect(batch.data.get(0)?.toJSON()).toEqual({name: 'b'});
    expect(batch.length).toBe(1);
  }

  await expect(source.getQueryMetadata({signal: AbortSignal.abort()})).rejects.toThrow();
});
