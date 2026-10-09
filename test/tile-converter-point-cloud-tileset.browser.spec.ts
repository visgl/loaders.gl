// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {Tiles3DTilesetSchema} from '@loaders.gl/3d-tiles/tileset-zod-schema';
import {createTilesetSpatialReference} from '@loaders.gl/tiles';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {Mesh} from '@loaders.gl/schema';
import {
  createPointCloudTilesetSink,
  createTileConversionArchive,
  encodePointCloudTileWithMetadata,
  encodePointCloudSourceTile,
  convertTileset,
  type EncodedPointCloudSourceTile,
  type TileConversionReport
} from '@loaders.gl/tile-converter/v5/browser';
import {createPointCloudTilesetSink as createRootSink} from '@loaders.gl/tile-converter/v5';
import JSZip from 'jszip';

/** Completed report for direct lifecycle checks. */
const REPORT: TileConversionReport = {
  state: 'completed',
  inputResources: 1,
  outputResources: 1,
  inputBytes: 0,
  outputBytes: 0,
  largestOutputResourceBytes: 0,
  diagnostics: []
};
/** Explicit native ECEF metadata; no source placement remains to be applied. */
const REFERENCE = createTilesetSpatialReference({
  sourceCrs: 'EPSG:4978',
  heightReference: 'ellipsoidal',
  coordinateFrame: 'geocentric',
  axisOrder: 'xyz'
});
/** Small double-precision positions exercising rounding at ECEF magnitudes. */
const POSITIONS = new Float64Array([6378137.1, 20.2, -30.3, 6378138.2, 24.4, -25.5]);
/** Immutable representative resource, parsed once below. */
let resource: EncodedPointCloudSourceTile;
/** Positions read from the encoded PNTS stream. */
let decodedPositions: number[];

/** Encodes a tiny source tile with deliberately unrelated source bounds. */
function createResource(id = '../untrusted-path', offset = 0): EncodedPointCloudSourceTile {
  const positions = Float64Array.from(
    POSITIONS,
    (value, index) => value + (index % 3 === 0 ? offset : 0)
  );
  return encodePointCloudSourceTile(
    {
      header: {
        id,
        level: 0,
        pointCount: 2,
        geometricError: 1,
        boundingVolume: {
          cartographicBounds: [
            [0, 0, 0],
            [1, 1, 1]
          ],
          center: [0, 0, 0],
          radius: 1
        }
      },
      content: {
        data: makeMeshArrowTable({
          POSITION: {value: positions, size: 3},
          COLOR_0: {value: new Uint8Array([255, 0, 0, 0, 255, 0]), size: 3}
        }),
        pointCount: 2,
        coordinateSystem: 'cartesian',
        cartographicOrigin: [0, 0, 0],
        spatialReference: REFERENCE
      }
    },
    {rtcCenter: [6378137 + offset, 20, -30], maxPositionError: 0.00001}
  )!;
}

beforeAll(async () => {
  resource = createResource();
  decodedPositions = Array.from(
    (await parse(resource.pnts, Tiles3DLoader, {worker: false})).attributes.positions!
  );
});

/** Creates the bounded point sink with a small explicit error budget. */
function createSink(maxTotalBytes = 10000, maxTiles = 2) {
  return createPointCloudTilesetSink({maxTotalBytes, maxTiles, geometricError: 0.00001});
}

/** Runs selected independent encoded tiles through the public sink lifecycle. */
function convertResources(
  sink: ReturnType<typeof createSink>,
  resources = [resource],
  signal?: AbortSignal
) {
  return convertTileset({
    source: {
      inspect: async () => undefined,
      async *read() {
        yield* resources;
      }
    },
    codec: {
      async *convert(input: EncodedPointCloudSourceTile) {
        yield input;
      }
    },
    sink,
    measureInputBytes: () => 0,
    measureOutputBytes: output => output.pnts.byteLength,
    signal
  });
}

test('point package retains decoded bounds, applies RTC once and authors indexed 3TZ', async () => {
  expect(createRootSink).toBe(createPointCloudTilesetSink);
  const sink = createSink();
  await convertResources(sink, [resource, createResource('second', 10)]);
  const files = sink.getFiles();
  expect(files.map(file => file.resourceId)).toEqual([
    'points/0.pnts',
    'points/1.pnts',
    'tileset.json'
  ]);
  const tileset = JSON.parse(await files[2].blob.text());
  expect(Tiles3DTilesetSchema.safeParse(tileset).success).toBe(true);
  expect(tileset.asset.version).toBe('1.0');
  expect(tileset.root.refine).toBe('ADD');
  expect(tileset.root.content).toBeUndefined();
  expect(tileset.root.children[0].transform).toBeUndefined();
  const box = tileset.root.children[0].boundingVolume.box;
  for (let axis = 0; axis < 3; axis++) {
    const points = [decodedPositions[axis], decodedPositions[axis + 3]];
    expect(resource.localBoundingBox[0][axis]).toBe(Math.min(...points));
    expect(resource.localBoundingBox[1][axis]).toBe(Math.max(...points));
    expect(box[axis]).toBe(
      Math.min(...points) / 2 + Math.max(...points) / 2 + resource.rtcCenter[axis]
    );
    expect(box[3 + axis * 4]).toBe((Math.max(...points) - Math.min(...points)) / 2);
  }
  expect(tileset.root.boundingVolume.box[3]).toBeGreaterThan(box[3]);
  expect(tileset.root.geometricError).toBeGreaterThan(10);
  const archive = await createTileConversionArchive(files, {format: '3tz', maxArchiveBytes: 20000});
  const zip = await JSZip.loadAsync(await archive.arrayBuffer(), {checkCRC32: true});
  expect(await zip.file('tileset.json')!.async('string')).toBe(await files[2].blob.text());
  expect(await zip.file('points/0.pnts')!.async('arraybuffer')).toEqual(resource.pnts);
  expect(zip.file('@3dtilesIndex1@')).not.toBeNull();
});

test('point metadata measures Euclidean rounding, preserves source arrays and gates precision', () => {
  const mesh: Mesh = {attributes: {POSITION: {value: POSITIONS, size: 3}}};
  const original = POSITIONS.slice();
  const rounded = encodePointCloudTileWithMetadata(mesh);
  expect(rounded.maximumPositionError).toBeGreaterThan(0.1);
  expect(rounded.rtcCenter).toEqual([0, 0, 0]);
  expect(() => encodePointCloudTileWithMetadata(mesh, {maxPositionError: 0.001})).toThrow(
    expect.objectContaining({code: 'POINT_CLOUD_PRECISION_EXCEEDED'})
  );
  expect(resource.maximumPositionError).toBeLessThan(0.00001);
  expect(POSITIONS).toEqual(original);
  expect(
    encodePointCloudTileWithMetadata(mesh, {maxPositionError: rounded.maximumPositionError}).pnts
  ).toEqual(rounded.pnts);
});

test('quantized positions are measured after decoding and RTC subtraction', () => {
  const encoded = encodePointCloudTileWithMetadata(
    {
      attributes: {
        POSITION: {
          size: 3,
          value: new Uint16Array([0, 65535, 0, 65535, 0, 65535]),
          transform: {type: 'quantization', bits: 16, origin: [10, 20, 30], range: 30}
        }
      }
    },
    {rtcCenter: [10, 20, 30], maxPositionError: 0}
  );
  expect(encoded.localBoundingBox).toEqual([
    [0, 0, 0],
    [30, 30, 30]
  ]);
  expect(encoded.maximumPositionError).toBe(0);
});

test.each([NaN, Infinity, -1])('point precision rejects invalid limit %s', maxPositionError => {
  expect(() =>
    encodePointCloudTileWithMetadata(
      {attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}},
      {maxPositionError}
    )
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_PRECISION_INVALID'}));
});

test.each([
  NaN,
  Infinity,
  1e40
])('point metadata rejects nonfinite or overflowing positions %s', value => {
  expect(() =>
    encodePointCloudTileWithMetadata({
      attributes: {POSITION: {size: 3, value: new Float64Array([value, 0, 0])}}
    })
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_POSITION_INVALID'}));
});

test.each([
  {bits: 0, origin: [0, 0, 0], range: 1},
  {bits: 33, origin: [0, 0, 0], range: 1},
  {bits: 16, origin: [0, 0], range: 1},
  {bits: 16, origin: [0, NaN, 0], range: 1},
  {bits: 16, origin: [0, 0, 0], range: -1}
])('point metadata rejects invalid quantization %j', transform => {
  expect(() =>
    encodePointCloudTileWithMetadata({
      attributes: {
        POSITION: {
          size: 3,
          value: new Uint16Array([0, 0, 0]),
          transform: {type: 'quantization', ...transform}
        }
      }
    })
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_POSITION_TRANSFORM_INVALID'}));
});

test('point source validates actual Arrow row count', () => {
  expect(() =>
    encodePointCloudSourceTile({
      header: resource.header,
      content: {
        data: makeMeshArrowTable({POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}),
        pointCount: 2,
        coordinateSystem: 'cartesian',
        cartographicOrigin: [0, 0, 0]
      }
    })
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_SOURCE_COUNT_INVALID'}));
});

test('point package copies payload, captures bounds, finalizes atomically and clears on abort', async () => {
  const sink = createSink();
  const copy = {
    ...resource,
    pnts: resource.pnts.slice(0),
    rtcCenter: [...resource.rtcCenter] as [number, number, number]
  };
  await sink.write(copy);
  expect(sink.getFiles()).toEqual([]);
  new Uint8Array(copy.pnts).fill(0);
  copy.rtcCenter.fill(0);
  await sink.finalize(REPORT);
  await expect(sink.getFiles()[0].blob.arrayBuffer()).resolves.toEqual(resource.pnts);
  await expect(sink.write(resource)).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_SINK_UNAVAILABLE'
  });
  await expect(sink.finalize(REPORT)).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_SINK_INCOMPLETE'
  });
  await sink.abort(new Error('discard'));
  expect(sink.getFiles()).toEqual([]);
});

test('point package accounts for final JSON at the inclusive byte boundary', async () => {
  const sink = createSink();
  await convertResources(sink);
  const total = sink.getFiles().reduce((sum, file) => sum + file.blob.size, 0);
  await expect(convertResources(createSink(total))).resolves.toMatchObject({state: 'completed'});
  const insufficient = createSink(total - 1);
  await expect(convertResources(insufficient)).rejects.toMatchObject({
    code: 'OUTPUT_MEMORY_LIMIT_EXCEEDED'
  });
  expect(insufficient.getFiles()).toEqual([]);
});

test.each([
  {...REFERENCE, sourceCrs: 'EPSG:3857', targetCrs: 'EPSG:3857'},
  {...REFERENCE, status: 'unresolved' as const},
  {...REFERENCE, heightReference: 'orthometric' as const},
  {...REFERENCE, coordinateFrame: 'geographic' as const},
  {...REFERENCE, axisOrder: 'yx' as const},
  {...REFERENCE, verticalUnitScale: 2},
  {...REFERENCE, units: ['foot', 'foot', 'foot']}
])('point package rejects an unsupported spatial declaration %j', spatialReference => {
  return expect(
    convertResources(createSink(), [{...resource, spatialReference}])
  ).rejects.toMatchObject({code: 'POINT_CLOUD_TILESET_FRAME_UNSUPPORTED'});
});

test.each([
  {spatialReference: undefined},
  {coordinateSystem: 'meter-offsets' as const},
  {cartographicOrigin: [1, 0, 0]},
  {modelMatrix: [1, 0, 0]},
  {modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]}
])('point package rejects unresolved source placement %j', changes => {
  return expect(convertResources(createSink(), [{...resource, ...changes}])).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_FRAME_UNSUPPORTED'
  });
});

test.each([
  NaN,
  -1,
  1
])('point package rejects invalid or excessive measured error %s', maximumPositionError => {
  return expect(
    convertResources(createSink(), [{...resource, maximumPositionError}])
  ).rejects.toMatchObject({code: 'POINT_CLOUD_GEOMETRIC_ERROR_INVALID'});
});

test.each([
  {rtcCenter: [0, 0] as unknown as [number, number, number]},
  {
    localBoundingBox: [
      [0, 0],
      [1, 1]
    ] as const
  },
  {
    localBoundingBox: [
      [NaN, 0, 0],
      [1, 1, 1]
    ] as const
  },
  {
    localBoundingBox: [
      [2, 0, 0],
      [1, 1, 1]
    ] as const
  },
  {
    rtcCenter: [1e308, 0, 0] as const,
    localBoundingBox: [
      [1e308, 0, 0],
      [1e308, 0, 0]
    ] as const
  }
])('point package rejects invalid encoded bounds %j', changes => {
  return expect(convertResources(createSink(), [{...resource, ...changes}])).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_BOUNDS_INVALID'
  });
});

test('point package rejects overflowing root extent', async () => {
  const sink = createSink();
  await expect(
    convertResources(sink, [
      {
        ...resource,
        rtcCenter: [0, 0, 0],
        localBoundingBox: [
          [-1e308, 0, 0],
          [1e308, 0, 0]
        ]
      }
    ])
  ).rejects.toMatchObject({code: 'POINT_CLOUD_TILESET_BOUNDS_INVALID'});
  expect(sink.getFiles()).toEqual([]);
});

test.each([
  {maxTiles: 0, geometricError: 0},
  {maxTiles: 1.5, geometricError: 0},
  {maxTiles: 1, geometricError: -1},
  {maxTiles: 1, geometricError: NaN}
])('point package validates options %j', options => {
  expect(() => createPointCloudTilesetSink({maxTotalBytes: 1000, ...options})).toThrow(
    expect.objectContaining({code: 'POINT_CLOUD_TILESET_OPTIONS_INVALID'})
  );
});

test('point package rejects empty, repeated, excess and concurrent placements', async () => {
  await expect(createSink().finalize(REPORT)).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_SINK_INCOMPLETE'
  });
  await expect(convertResources(createSink(), [{...resource, id: ''}])).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_PLACEMENT_INVALID'
  });
  await expect(convertResources(createSink(), [resource, resource])).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_PLACEMENT_INVALID'
  });
  await expect(
    convertResources(createSink(10000, 1), [resource, createResource('second')])
  ).rejects.toMatchObject({code: 'POINT_CLOUD_TILESET_PLACEMENT_INVALID'});
  const sink = createSink();
  const pending = sink.write(resource);
  await expect(sink.write(createResource('second'))).rejects.toMatchObject({
    code: 'POINT_CLOUD_TILESET_SINK_UNAVAILABLE'
  });
  await pending;
  await sink.abort(new Error('discard'));
});

test('point package preserves cancellation and abort during a pending write', async () => {
  const reason = new Error('cancel');
  const cancelled = createSink();
  await expect(convertResources(cancelled, [resource], AbortSignal.abort(reason))).rejects.toBe(
    reason
  );
  expect(cancelled.getFiles()).toEqual([]);
  const sink = createSink();
  const pending = sink.write(resource);
  await sink.abort(reason);
  await expect(pending).rejects.toMatchObject({code: 'POINT_CLOUD_TILESET_SINK_UNAVAILABLE'});
  expect(sink.getFiles()).toEqual([]);
});

test.each([
  {byteOffset: 4},
  {byteStride: 12},
  {normalized: true},
  {componentType: 'float16' as const}
])('point precision rejects an unsupported POSITION layout %j', layout => {
  expect(() =>
    encodePointCloudTileWithMetadata({
      attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0]), ...layout}}
    })
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_POSITION_REQUIRED'}));
});

test.each([[], [1, 2]])('point precision rejects invalid point count %j', positions => {
  expect(() =>
    encodePointCloudTileWithMetadata({
      attributes: {POSITION: {size: 3, value: new Float32Array(positions)}}
    })
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_POSITION_COUNT_INVALID'}));
});

test('point precision rejects invalid RTC and a directional position transform', () => {
  const mesh = {attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}};
  expect(() => encodePointCloudTileWithMetadata(mesh, {rtcCenter: [NaN, 0, 0]})).toThrow(
    expect.objectContaining({code: 'POINT_CLOUD_RTC_CENTER_INVALID'})
  );
  expect(() =>
    encodePointCloudTileWithMetadata({
      attributes: {
        POSITION: {...mesh.attributes.POSITION, transform: {type: 'octahedron', bits: 8}}
      }
    })
  ).toThrow(expect.objectContaining({code: 'POINT_CLOUD_POSITION_TRANSFORM_INVALID'}));
});

test('point package accepts transformed ECEF and identity placement without reapplying either', async () => {
  const sink = createSink();
  await convertResources(sink, [
    {
      ...resource,
      modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      spatialReference: {
        ...REFERENCE,
        sourceCrs: 'EPSG:4326',
        targetCrs: 'EPSG:4978',
        coordinateFrame: 'geographic',
        status: 'transformed',
        targetHeightReference: 'ellipsoidal'
      }
    }
  ]);
  const tileset = JSON.parse(await sink.getFiles()[1].blob.text());
  expect(tileset.root.children[0].transform).toBeUndefined();
});

test.each([
  0, 1
])('point package aborts pending finalization at phase %s without publishing files', async phase => {
  const sink = createSink();
  await sink.write(resource);
  const pending = sink.finalize(REPORT);
  if (phase) await Promise.resolve();
  await sink.abort(new Error('cancel'));
  await expect(pending).rejects.toMatchObject({code: 'POINT_CLOUD_TILESET_SINK_UNAVAILABLE'});
  expect(sink.getFiles()).toEqual([]);
});
