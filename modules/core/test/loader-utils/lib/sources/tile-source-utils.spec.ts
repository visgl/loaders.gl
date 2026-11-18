// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {getTileDataBatch} from '../../../../src/loader-utils/lib/sources/tile-source-utils';
import type {TileSource} from '../../../../src/loader-utils/lib/sources/tile-source';

test('Batch fallback preserves the complete consumer request', async () => {
  const request = {
    index: {z: 0, x: 1, y: 2},
    tileMatrix: 'native-level',
    signal: new AbortController().signal
  };
  const getTileData = vi.fn(async () => null);
  await Promise.all(getTileDataBatch({getTileData} as unknown as TileSource, [request]));
  expect(getTileData).toHaveBeenCalledWith(request);
  expect(getTileData.mock.calls[0][0]).toBe(request);
});
