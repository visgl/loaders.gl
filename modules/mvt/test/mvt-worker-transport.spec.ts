// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  deserializeMVTWorkerResult,
  serializeMVTWorkerResult
} from '../src/lib/mvt-worker-transport';

test('MVT worker transport round-trips Arrow tables and preserves other results', () => {
  const table = {shape: 'arrow-table', data: arrow.tableFromArrays({value: [1, 2]})} as const;
  const serialized = serializeMVTWorkerResult(table, {
    core: {workerTransferBufferCopy: 'slice'}
  } as any) as any;
  const hydrated = deserializeMVTWorkerResult(serialized) as any;

  expect(serialized.data.transport).toBe('arrow-js');
  expect(hydrated.data).toBeInstanceOf(arrow.Table);
  expect(hydrated.data.getChild('value')?.toArray()).toEqual(new Float64Array([1, 2]));
  expect(serializeMVTWorkerResult(null)).toBeNull();
  expect(serializeMVTWorkerResult({shape: 'object-row-table'})).toEqual({
    shape: 'object-row-table'
  });
  expect(deserializeMVTWorkerResult('unchanged')).toBe('unchanged');

  const topLevelCopy = serializeMVTWorkerResult(table, {
    workerTransferBufferCopy: 'transfer'
  } as any) as any;
  expect(topLevelCopy.data.transport).toBe('arrow-js');
});
