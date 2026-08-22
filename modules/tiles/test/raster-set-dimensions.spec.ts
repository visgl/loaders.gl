// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, expectTypeOf, test} from 'vitest';
import type {
  GetRasterParameters,
  RasterData,
  RasterSource,
  RasterSourceMetadata,
  RasterViewport
} from '@loaders.gl/loader-utils';
import {RasterSet} from '@loaders.gl/tiles';

type TemporalRasterParameters = GetRasterParameters & {
  selection: {time: number};
};

type TemporalRasterMetadata = RasterSourceMetadata & {
  selectionDimensions: Array<{name: string; size: number; defaultIndex: number}>;
};

test('RasterSet preserves source-specific request and metadata types', async () => {
  const viewport: RasterViewport = {
    id: 'temporal-raster',
    width: 2,
    height: 1,
    zoom: 0,
    center: [0, 0],
    bounds: [
      [0, 0],
      [2, 1]
    ],
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], position[2] || 0]
  };
  const metadata: TemporalRasterMetadata = {
    width: 2,
    height: 1,
    bandCount: 1,
    dtype: 'float32',
    selectionDimensions: [{name: 'time', size: 12, defaultIndex: 0}]
  };
  const raster: RasterData = {
    data: new Float32Array([1, 2]),
    width: 2,
    height: 1,
    bandCount: 1,
    dtype: 'float32'
  };
  let receivedParameters: TemporalRasterParameters | null = null;
  let startedTimeIndex: number | null = null;
  const source: RasterSource<RasterData, TemporalRasterParameters, TemporalRasterMetadata> = {
    getMetadata: async () => metadata,
    getRaster: async parameters => {
      receivedParameters = parameters;
      return raster;
    }
  };
  const rasterSet = RasterSet.fromRasterSource(source, {
    shouldRefetch: ({currentRequest, nextParameters, metadata: currentMetadata}) =>
      !currentRequest ||
      currentRequest.parameters.selection.time !== nextParameters.selection.time ||
      currentMetadata?.selectionDimensions[0].name !== 'time'
  });

  expectTypeOf(rasterSet.metadata).toEqualTypeOf<TemporalRasterMetadata | null>();
  expectTypeOf(rasterSet.currentRequest?.parameters).toEqualTypeOf<
    TemporalRasterParameters | undefined
  >();

  const loadedMetadata = await rasterSet.loadMetadata();
  const loadedRequest = new Promise<TemporalRasterParameters>(resolve => {
    rasterSet.subscribe({
      onRasterLoadStart: (_requestId, parameters) => {
        startedTimeIndex = parameters.selection.time;
      },
      onRasterLoad: request => resolve(request.parameters)
    });
  });

  rasterSet.requestRaster({viewport, selection: {time: 4}});
  const acceptedParameters = await loadedRequest;

  expect(loadedMetadata.selectionDimensions).toEqual([{name: 'time', size: 12, defaultIndex: 0}]);
  expect(startedTimeIndex).toBe(4);
  expect(acceptedParameters.selection.time).toBe(4);
  expect(receivedParameters).not.toBeNull();
  expect(receivedParameters!.selection.time).toBe(4);
  expect(receivedParameters!.signal).toBeInstanceOf(AbortSignal);
  expect(rasterSet.shouldRefetchRaster({viewport, selection: {time: 4}})).toBe(false);
  expect(rasterSet.shouldRefetchRaster({viewport, selection: {time: 5}})).toBe(true);

  rasterSet.finalize();
});
