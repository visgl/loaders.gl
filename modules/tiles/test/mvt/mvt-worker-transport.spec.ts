// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  deserializeMVTWorkerResult,
  serializeMVTWorkerResult
} from '../../src/mvt/lib/mvt-worker-transport';

test('MVT worker transport round-trips Arrow tables and preserves other results', () => {
  const table = arrow.tableFromArrays({value: [1, 2]});
  const serialized = serializeMVTWorkerResult(table, {
    core: {workerTransferBufferCopy: 'slice'}
  } as any) as any;
  const hydrated = deserializeMVTWorkerResult(serialized) as any;

  expect(serialized.columns.data.transport).toBe('arrow-js');
  expect(hydrated).toBeInstanceOf(arrow.Table);
  expect(hydrated.getChild('value')?.toArray()).toEqual(new Float64Array([1, 2]));
  expect(serializeMVTWorkerResult(null)).toBeNull();
  expect(serializeMVTWorkerResult({shape: 'object-row-table'})).toEqual({
    shape: 'object-row-table'
  });
  expect(deserializeMVTWorkerResult('unchanged')).toBe('unchanged');

  const topLevelCopy = serializeMVTWorkerResult(table, {
    workerTransferBufferCopy: 'transfer'
  } as any) as any;
  expect(topLevelCopy.columns.data.transport).toBe('arrow-js');
});
