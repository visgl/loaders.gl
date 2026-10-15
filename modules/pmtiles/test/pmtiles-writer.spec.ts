// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {encode} from '@loaders.gl/core';
import {GZipCompressor} from '@loaders.gl/compression';
import {PMTiles, type Source} from 'pmtiles';
import {encodePMTiles, PMTilesWriter, PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import type {PMTilesEncodeOptions, PMTilesTile} from '@loaders.gl/pmtiles';

const OPTIONS: PMTilesEncodeOptions = {
  tileType: 'mvt',
  metadata: {vector_layers: [{id: 'features', fields: {kind: 'String'}}]}
};
const TILE: PMTilesTile = {z: 0, x: 0, y: 0, data: new Uint8Array([1, 2, 3])};

/** Uses the independent reference reader, with no filesystem or public network access. */
function openArchive(bytes: ArrayBuffer): PMTiles {
  const source: Source = {
    getKey: () => 'encoded-archive',
    getBytes: async (offset, length) => ({data: bytes.slice(offset, offset + length)})
  };
  return new PMTiles(source);
}

describe('PMTiles packaging', () => {
  test.each([
    ['mvt', 1],
    ['png', 2],
    ['jpeg', 3],
    ['webp', 4],
    ['avif', 5],
    ['mlt', 6]
  ] as const)('preserves opaque %s payloads and declares type %i', async (tileType, value) => {
    const bytes = await encodePMTiles([TILE], {...OPTIONS, tileType});
    const archive = openArchive(bytes);
    const header = await archive.getHeader();
    expect(header).toMatchObject({
      specVersion: 3,
      tileType: value,
      minZoom: 0,
      maxZoom: 0,
      clustered: true,
      numAddressedTiles: 1,
      numTileEntries: 1,
      numTileContents: 1,
      internalCompression: 1,
      tileCompression: 1,
      leafDirectoryLength: 0
    });
    expect(await archive.getMetadata()).toEqual(OPTIONS.metadata);
    expect(new Uint8Array((await archive.getZxy(0, 0, 0))!.data)).toEqual(TILE.data);
  });

  test('supports the standard encode API, source metadata and raw tile reads', async () => {
    const bytes = await encode([TILE], PMTilesWriter, {pmtiles: OPTIONS});
    const source = PMTilesSourceLoader.createDataSource(new Blob([bytes]), {});
    expect(await source.getMetadata()).toMatchObject({
      formatVersion: 3,
      tileMIMEType: 'application/vnd.mapbox-vector-tile',
      minZoom: 0,
      maxZoom: 0
    });
    expect(new Uint8Array((await source.getTile({z: 0, x: 0, y: 0}))!)).toEqual(TILE.data);
  });

  test('sorts Hilbert IDs deterministically and retains sparse high-zoom addresses', async () => {
    const tiles = [
      {...TILE, z: 26, x: 67108863, y: 67108863},
      {...TILE, z: 1, x: 1, y: 0, data: new Uint8Array([4])},
      {...TILE, z: 1, x: 0, y: 1, data: new Uint8Array([2])}
    ];
    const first = await encodePMTiles(tiles, OPTIONS);
    expect(await encodePMTiles([...tiles].reverse(), OPTIONS)).toEqual(first);
    const archive = openArchive(first);
    expect(await archive.getHeader()).toMatchObject({minZoom: 1, maxZoom: 26});
    for (const tile of tiles)
      expect(new Uint8Array((await archive.getZxy(tile.z, tile.x, tile.y))!.data)).toEqual(
        tile.data
      );
    expect(await archive.getZxy(1, 0, 0)).toBeUndefined();
  });

  test('supports Blob, offset views and snapshots across async iteration', async () => {
    const bytes = new Uint8Array([99, 5, 6, 99]);
    async function* tiles() {
      yield {...TILE, z: 1, data: new DataView(bytes.buffer, 1, 2)};
      bytes.fill(9);
      yield {...TILE, z: 1, x: 1, data: new Blob([new Uint8Array([7, 8])])};
      yield {...TILE, z: 1, y: 1, data: new Uint8Array([3]).buffer};
    }
    const archive = openArchive(await encodePMTiles(tiles(), OPTIONS));
    expect(new Uint8Array((await archive.getZxy(1, 0, 0))!.data)).toEqual(new Uint8Array([5, 6]));
    expect(new Uint8Array((await archive.getZxy(1, 1, 0))!.data)).toEqual(new Uint8Array([7, 8]));
    expect(new Uint8Array((await archive.getZxy(1, 0, 1))!.data)).toEqual(new Uint8Array([3]));
  });

  test('writes root and leaf directories within the 16 KiB header window', async () => {
    // 4,097 one-byte tiles force an uncompressed leaf directory, with a tiny total payload.
    const tiles = Array.from({length: 4097}, (_, index) => ({
      z: 7,
      x: index % 128,
      y: Math.floor(index / 128),
      data: new Uint8Array([index % 251])
    }));
    const bytes = await encodePMTiles(tiles, {tileType: 'png'});
    const archive = openArchive(bytes);
    const header = await archive.getHeader();
    expect(header.rootDirectoryOffset + header.rootDirectoryLength).toBeLessThanOrEqual(16384);
    expect(header.leafDirectoryLength).toBeGreaterThan(0);
    expect(header.numAddressedTiles).toBe(tiles.length);
    for (const index of [0, 1023, 2048, 4096]) {
      const tile = tiles[index];
      expect(new Uint8Array((await archive.getZxy(tile.z, tile.x, tile.y))!.data)).toEqual(
        tile.data
      );
    }
  });

  test('compresses internal sections and preserves already gzipped tile payloads', async () => {
    const data = await new GZipCompressor().compress(new Uint8Array([4, 5, 6]).buffer);
    const options: PMTilesEncodeOptions = {
      ...OPTIONS,
      internalCompression: 'gzip',
      tileCompression: 'gzip'
    };
    const bytes = await encodePMTiles([{...TILE, data}], options);
    expect(await encodePMTiles([{...TILE, data}], options)).toEqual(bytes);
    const archive = openArchive(bytes);
    const header = await archive.getHeader();
    expect(header).toMatchObject({internalCompression: 2, tileCompression: 2});
    expect(await archive.getMetadata()).toEqual(OPTIONS.metadata);
    expect(new Uint8Array((await archive.getZxy(0, 0, 0))!.data)).toEqual(
      new Uint8Array([4, 5, 6])
    );
    expect(bytes.slice(header.tileDataOffset)).toEqual(data);
  });

  test.each([
    'brotli',
    'zstd'
  ] as const)('declares existing %s compression without touching payloads', async tileCompression => {
    const bytes = await encodePMTiles([TILE], {...OPTIONS, tileCompression});
    const header = await openArchive(bytes).getHeader();
    expect(header.tileCompression).toBe(tileCompression === 'brotli' ? 3 : 4);
    expect(new Uint8Array(bytes.slice(header.tileDataOffset))).toEqual(TILE.data);
  });

  test('derives tile-footprint bounds and supports explicit bounds and center', async () => {
    const derived = await openArchive(await encodePMTiles([{...TILE, z: 1}], OPTIONS)).getHeader();
    expect(derived).toMatchObject({minLon: -180, maxLon: 0, minLat: 0, maxZoom: 1, centerZoom: 1});
    expect(derived.maxLat).toBeCloseTo(85.0511288);
    const header = await openArchive(
      await encodePMTiles([TILE], {...OPTIONS, bounds: [-10, -5, 20, 15], center: [5, 5, 0]})
    ).getHeader();
    expect(header).toMatchObject({
      minLon: -10,
      minLat: -5,
      maxLon: 20,
      maxLat: 15,
      centerLon: 5,
      centerLat: 5,
      centerZoom: 0
    });
  });

  test('cancels before consumption and closes iterators after a mid-input abort', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(encodePMTiles([TILE], {...OPTIONS, signal: controller.signal})).rejects.toThrow();
    const during = new AbortController();
    let closed = false;
    async function* tiles() {
      try {
        yield TILE;
        during.abort();
        yield {...TILE, z: 1};
      } finally {
        closed = true;
      }
    }
    await expect(encodePMTiles(tiles(), {...OPTIONS, signal: during.signal})).rejects.toThrow();
    expect(closed).toBe(true);
  });

  test('preserves producer failures and cleans up when a budget is exceeded', async () => {
    async function* fails() {
      yield TILE;
      throw new Error('producer failure');
    }
    await expect(encodePMTiles(fails(), OPTIONS)).rejects.toThrow('producer failure');
    let closed = false;
    async function* tiles() {
      try {
        yield TILE;
        yield {...TILE, z: 1};
      } finally {
        closed = true;
      }
    }
    await expect(encodePMTiles(tiles(), {...OPTIONS, maxTiles: 1})).rejects.toThrow(
      'tile limit exceeded'
    );
    expect(closed).toBe(true);
  });

  test.each([
    {z: -1},
    {z: 27},
    {z: 0.5},
    {x: -1},
    {y: -1},
    {x: 1},
    {y: 1},
    {x: NaN},
    {y: 0.5}
  ])('rejects invalid XYZ coordinates %j', async coordinate => {
    await expect(encodePMTiles([{...TILE, ...coordinate}], OPTIONS)).rejects.toThrow('coordinate');
  });

  test.each([
    {tileType: 'unknown'},
    {tileType: 'constructor'},
    {tileCompression: 'unknown'},
    {internalCompression: 'brotli'},
    {maxTiles: 0},
    {maxTiles: Infinity},
    {maxOutputBytes: -1},
    {maxMetadataBytes: 1.5},
    {bounds: [20, 0, 10, 1]},
    {bounds: [0, 2, 1, 1]},
    {bounds: [-181, 0, 0, 1]},
    {bounds: [0, -91, 1, 1]},
    {bounds: [0, 0, NaN, 1]},
    {bounds: [0, 0, 1]},
    {center: [181, 0, 0]},
    {center: [0, 91, 0]},
    {center: [0, 0, 1]},
    {center: [0, 0, NaN]},
    {center: [0, 0]},
    {metadata: []},
    {metadata: {toJSON: () => 'invalid'}},
    {metadata: {}},
    {metadata: {vector_layers: []}},
    {metadata: {vector_layers: [{id: 'a'}]}},
    {metadata: {vector_layers: [{id: 'a', fields: {x: 'BigInt'}}]}},
    {
      metadata: {
        vector_layers: [
          {id: 'a', fields: {}},
          {id: 'a', fields: {}}
        ]
      }
    }
  ])('rejects invalid encoding options %j', async overrides => {
    await expect(
      encodePMTiles([TILE], {...OPTIONS, ...overrides} as PMTilesEncodeOptions)
    ).rejects.toThrow();
  });

  test('rejects missing type, empty input, empty or invalid bytes and duplicate coordinates', async () => {
    await expect(encodePMTiles([TILE])).rejects.toThrow('tileType');
    await expect(PMTilesWriter.encode([TILE])).rejects.toThrow('tileType');
    await expect(encodePMTiles([], OPTIONS)).rejects.toThrow('at least one tile');
    await expect(encodePMTiles([{...TILE, data: new Uint8Array(0)}], OPTIONS)).rejects.toThrow(
      'nonempty'
    );
    await expect(encodePMTiles([{...TILE, data: 'invalid' as any}], OPTIONS)).rejects.toThrow(
      'tile data'
    );
    await expect(encodePMTiles([TILE, TILE], OPTIONS)).rejects.toThrow('Duplicate');
  });

  test('enforces output and metadata budgets including archive overhead', async () => {
    const bytes = await encodePMTiles([TILE], OPTIONS);
    expect(await encodePMTiles([TILE], {...OPTIONS, maxOutputBytes: bytes.byteLength})).toEqual(
      bytes
    );
    await expect(encodePMTiles([TILE], {...OPTIONS, maxOutputBytes: 129})).rejects.toThrow(
      'output limit'
    );
    await expect(
      encodePMTiles([TILE], {...OPTIONS, maxOutputBytes: bytes.byteLength - 1})
    ).rejects.toThrow('output limit');
    await expect(encodePMTiles([TILE], {...OPTIONS, maxMetadataBytes: 2})).rejects.toThrow(
      'metadata limit'
    );
  });
});
