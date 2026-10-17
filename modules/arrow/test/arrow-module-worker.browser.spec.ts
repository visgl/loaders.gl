// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encode, parse} from '@loaders.gl/core';
import {ArrowLoader, ArrowWriter} from '@loaders.gl/arrow';

test('ESM Arrow worker loads sidecar codecs and hydrates a compressed table', async () => {
  const input = await encode(
    [{name: 'value', array: new Float32Array([1, 2, 3]), type: 0}],
    ArrowWriter,
    {arrow: {container: 'file', compression: 'zstd'}}
  );
  const workerLoader = {
    ...ArrowLoader,
    loadWorker: () =>
      new Worker(new URL('/modules/arrow/dist/arrow-worker.mjs', location.href), {type: 'module'})
  };
  const result = await parse(input, workerLoader, {
    core: {worker: true, reuseWorkers: false},
    arrow: {shape: 'arrow-table'}
  });
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') {
    expect(result.data.numRows).toBe(3);
    expect(Array.from(result.data.getChild('value')!.toArray())).toEqual([1, 2, 3]);
  }
});
