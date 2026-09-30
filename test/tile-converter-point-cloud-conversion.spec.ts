// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {PointCloudTileHeader, PointCloudTilesetSource} from '@loaders.gl/tiles';
import {convertPointCloudSource} from '../apps/tile-converter/src/v5/point-cloud-conversion';
import type {EncodedPointCloudSourceTile} from '../apps/tile-converter/src/v5/point-cloud-source-encoder';
import type {TileConversionSink} from '../apps/tile-converter/src/v5/conversion-api';

/** Minimal source surface exercised by this conversion fixture. */
type TestPointCloudSource = Pick<
  PointCloudTilesetSource,
  'isReady' | 'initialize' | 'getRootTile' | 'getChildren' | 'loadTileContent'
>;

/** Creates a tiny initialized-on-demand source with one empty tile between two point tiles. */
function createSource() {
  const root: PointCloudTileHeader = {
    id: 'root',
    level: 0,
    pointCount: 1,
    geometricError: 1,
    boundingVolume: {
      cartographicBounds: [
        [10, 20, 30],
        [10, 20, 30]
      ],
      center: [10, 20, 30],
      radius: 1,
      coordinateFrame: 'cartesian'
    }
  };
  const data = makeMeshArrowTable({POSITION: {value: new Float32Array([10, 20, 30]), size: 3}});
  const source: TestPointCloudSource = {
    isReady: false,
    initialize: vi.fn(async () => {
      source.isReady = true;
    }),
    getRootTile: vi.fn(async () => root),
    getChildren: vi.fn(async (header: PointCloudTileHeader) =>
      header.id === 'root'
        ? [
            {...root, id: 'empty', level: 1, pointCount: 0},
            {...root, id: 'child', level: 1}
          ]
        : []
    ),
    loadTileContent: vi.fn(async (header: PointCloudTileHeader) =>
      header.id === 'empty'
        ? null
        : {
            data,
            pointCount: 1,
            coordinateSystem: 'cartesian' as const,
            cartographicOrigin: [0, 0, 0]
          }
    )
  };
  return source;
}

/** Creates a destination whose lifecycle calls can be observed or replaced by each case. */
function createSink(): TileConversionSink<EncodedPointCloudSourceTile> {
  return {
    write: vi.fn(async () => {}),
    finalize: vi.fn(async () => {}),
    abort: vi.fn(async () => {})
  };
}

test('convertPointCloudSource awaits writes, forwards encoder options, and reports counts', async () => {
  const source = createSource();
  const sink = createSink();
  const written: EncodedPointCloudSourceTile[] = [];
  let releaseWrite!: () => void;
  let notifyWrite!: () => void;
  const writeGate = new Promise<void>(resolve => {
    releaseWrite = resolve;
  });
  const writeStarted = new Promise<void>(resolve => {
    notifyWrite = resolve;
  });
  sink.write = vi.fn(async (tile: EncodedPointCloudSourceTile) => {
    written.push(tile);
    if (tile.id === 'root') {
      notifyWrite();
      await writeGate;
    }
  });
  const getTileEncodingOptions = vi.fn(() => ({rtcCenter: [10, 20, 30] as const}));
  const onProgress = vi.fn();
  const conversion = convertPointCloudSource(source as unknown as PointCloudTilesetSource, {
    sink,
    measureInputBytes: tile => (tile.content ? 12 : 0),
    getTileEncodingOptions,
    onProgress
  });
  await writeStarted;
  try {
    expect(source.loadTileContent).toHaveBeenCalledTimes(1);
    expect(source.getChildren).not.toHaveBeenCalled();
    expect(sink.finalize).not.toHaveBeenCalled();
  } finally {
    releaseWrite();
  }
  const report = await conversion;
  const outputBytes = written.reduce((total, tile) => total + tile.pnts.byteLength, 0);

  expect(written.map(tile => tile.id)).toEqual(['root', 'child']);
  expect(getTileEncodingOptions).toHaveBeenCalledTimes(2);
  expect(source.initialize).toHaveBeenCalledTimes(1);
  expect(report).toEqual({
    state: 'completed',
    inputResources: 3,
    outputResources: 2,
    inputBytes: 24,
    outputBytes,
    largestOutputResourceBytes: written[0].pnts.byteLength,
    diagnostics: []
  });
  expect(onProgress).toHaveBeenLastCalledWith({
    phase: 'finalize',
    inputResources: 3,
    outputResources: 2,
    inputBytes: 24,
    outputBytes
  });
  expect(sink.finalize).toHaveBeenCalledWith(report);
  expect(sink.abort).not.toHaveBeenCalled();
  const parsed = await parse(written[0].pnts, Tiles3DLoader, {worker: false});
  expect(parsed.rtcCenter).toEqual([10, 20, 30]);
});

test('convertPointCloudSource honors depth limits on an already initialized source', async () => {
  const source = createSource();
  source.isReady = true;
  const sink = createSink();
  const report = await convertPointCloudSource(source as unknown as PointCloudTilesetSource, {
    sink,
    measureInputBytes: () => 12,
    maxDepth: 0
  });

  expect(source.initialize).not.toHaveBeenCalled();
  expect(source.getChildren).not.toHaveBeenCalled();
  expect(report).toMatchObject({inputResources: 1, outputResources: 1});
  expect(sink.write).toHaveBeenCalledTimes(1);
});

test('convertPointCloudSource rejects oversized output before writing', async () => {
  const source = createSource();
  const sink = createSink();
  await expect(
    convertPointCloudSource(source as unknown as PointCloudTilesetSource, {
      sink,
      measureInputBytes: () => 12,
      maxOutputResourceBytes: 1
    })
  ).rejects.toMatchObject({code: 'OUTPUT_RESOURCE_TOO_LARGE'});

  expect(sink.write).not.toHaveBeenCalled();
  expect(sink.finalize).not.toHaveBeenCalled();
  expect(sink.abort).toHaveBeenCalledWith(
    expect.objectContaining({code: 'OUTPUT_RESOURCE_TOO_LARGE'})
  );
});

test.each([
  'initialize',
  'loadTileContent',
  'write',
  'finalize'
] as const)('convertPointCloudSource aborts when %s fails', async phase => {
  const source = createSource();
  const sink = createSink();
  const failure = new Error(`${phase} failed`);
  const fail = vi.fn(async () => {
    throw failure;
  });
  if (phase === 'initialize' || phase === 'loadTileContent') {
    source[phase] = fail;
  } else {
    sink[phase] = fail;
  }
  await expect(
    convertPointCloudSource(source as unknown as PointCloudTilesetSource, {
      sink,
      measureInputBytes: () => 12
    })
  ).rejects.toBe(failure);
  expect(sink.abort).toHaveBeenCalledExactlyOnceWith(failure);
});

test('convertPointCloudSource observes cancellation from an encoder callback before writing', async () => {
  const source = createSource();
  const sink = createSink();
  const controller = new AbortController();
  const reason = new Error('cancelled');
  await expect(
    convertPointCloudSource(source as unknown as PointCloudTilesetSource, {
      sink,
      measureInputBytes: () => 12,
      signal: controller.signal,
      getTileEncodingOptions: () => {
        controller.abort(reason);
        return {};
      }
    })
  ).rejects.toBe(reason);

  expect(sink.write).not.toHaveBeenCalled();
  expect(sink.finalize).not.toHaveBeenCalled();
  expect(source.getChildren).not.toHaveBeenCalled();
  expect(sink.abort).toHaveBeenCalledExactlyOnceWith(reason);
});

test('convertPointCloudSource aborts on invalid encoding options', async () => {
  const source = createSource();
  const sink = createSink();
  await expect(
    convertPointCloudSource(source as PointCloudTilesetSource, {
      sink,
      measureInputBytes: () => 12,
      getTileEncodingOptions: () => ({rtcCenter: [NaN, 0, 0]})
    })
  ).rejects.toMatchObject({code: 'POINT_CLOUD_RTC_CENTER_INVALID'});

  expect(sink.write).not.toHaveBeenCalled();
  expect(sink.finalize).not.toHaveBeenCalled();
  expect(sink.abort).toHaveBeenCalledWith(
    expect.objectContaining({code: 'POINT_CLOUD_RTC_CENTER_INVALID'})
  );
});

test('convertPointCloudSource aborts before writing unsupported point attributes', async () => {
  const source = createSource();
  source.loadTileContent = vi.fn(async () => ({
    data: makeMeshArrowTable({
      POSITION: {value: new Float32Array([10, 20, 30]), size: 3},
      classification: {value: new Uint8Array([2]), size: 1}
    }),
    pointCount: 1,
    coordinateSystem: 'cartesian' as const,
    cartographicOrigin: [0, 0, 0]
  }));
  const sink = createSink();

  await expect(
    convertPointCloudSource(source as PointCloudTilesetSource, {
      sink,
      measureInputBytes: () => 13
    })
  ).rejects.toMatchObject({code: 'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED'});
  expect(sink.write).not.toHaveBeenCalled();
  expect(sink.finalize).not.toHaveBeenCalled();
  expect(source.getChildren).not.toHaveBeenCalled();
  expect(sink.abort).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({code: 'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED'})
  );
});
