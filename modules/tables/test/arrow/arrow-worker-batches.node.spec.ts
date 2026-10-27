// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table, tableFromArrays, tableToIPC} from 'apache-arrow';
import {parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {ArrowLoader} from '../../src/arrow/arrow-loader-types';
import {GeoArrowLoader} from '../../src/arrow/geoarrow-loader-types';

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test.each([
  ArrowLoader,
  GeoArrowLoader
])('$format uses the packaged Node worker with explicit opt-in', async metadata => {
  const parser = await metadata.preload();
  const mainParser = vi.fn(parser.parseInBatches);
  const loader = {...metadata, preload: async () => ({...parser, parseInBatches: mainParser})};
  const batches = await parseInBatches(
    [tableToIPC(tableFromArrays({id: new Int32Array([1])}))],
    loader,
    {
      core: {worker: true, _nodeWorkers: true, _workerType: 'classic'}
    }
  );
  const results = [];
  for await (const batch of batches) results.push(batch);
  expect(mainParser).not.toHaveBeenCalled();
  expect(results).toHaveLength(1);
  expect(results[0].data).toBeInstanceOf(Table);
  expect(results[0].data.getChild('id')?.get(0)).toBe(1);
});
