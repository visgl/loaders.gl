import {expect, test} from 'vitest';
import type {Header, TileType} from 'pmtiles';
import {parsePMTilesHeader} from '../src/lib/parse-pmtiles';

function createHeader(tileType: TileType): Header {
  return {
    specVersion: 3,
    rootDirectoryOffset: 127,
    rootDirectoryLength: 64,
    jsonMetadataOffset: 191,
    jsonMetadataLength: 32,
    leafDirectoryOffset: 223,
    leafDirectoryLength: 0,
    tileDataOffset: 223,
    tileDataLength: 0,
    addressedTilesCount: 0,
    tileEntriesCount: 0,
    tileContentsCount: 0,
    clustered: true,
    internalCompression: 1,
    tileCompression: 1,
    tileType,
    minZoom: 2,
    maxZoom: 12,
    minLon: -10,
    minLat: -20,
    maxLon: 30,
    maxLat: 40,
    centerLon: 5,
    centerLat: 6,
    centerZoom: 7,
    etag: 'etag'
  };
}

test.each([
  [1, 'application/vnd.mapbox-vector-tile'],
  [2, 'image/png'],
  [3, 'image/jpeg'],
  [4, 'image/webp'],
  [5, 'image/avif'],
  [0, 'application/octet-stream'],
  [6, 'application/octet-stream']
])('parsePMTilesHeader#decodes tile type %s', (tileType, tileMIMEType) => {
  const metadata = parsePMTilesHeader(createHeader(tileType as TileType), null);

  expect(metadata.tileMIMEType).toBe(tileMIMEType);
  expect(metadata.boundingBox).toEqual([
    [-10, -20],
    [30, 40]
  ]);
  expect(metadata.center).toEqual([5, 6]);
  expect(metadata.minZoom).toBe(2);
  expect(metadata.maxZoom).toBe(12);
  expect(metadata.etag).toBe('etag');
});

test('parsePMTilesHeader#extracts TileJSON metadata', () => {
  const metadata = parsePMTilesHeader(createHeader(1 as TileType), {
    name: 'Example tiles',
    attribution: '<a>Example</a>',
    vector_layers: []
  });

  expect(metadata.name).toBe('Example tiles');
  expect(metadata.attributions).toEqual([]);
  expect(metadata.tilejson?.layers).toEqual([]);
});

test('parsePMTilesHeader#retains format data when requested', () => {
  const header = createHeader(1 as TileType);
  const metadata = parsePMTilesHeader(header, null, {includeFormatHeader: true});

  expect(metadata.formatHeader).toBe(header);
  expect(metadata.formatMetadata).toBe(metadata);
});

test('parsePMTilesHeader#tolerates invalid TileJSON metadata', () => {
  const metadata = parsePMTilesHeader(createHeader(1 as TileType), {
    vector_layers: 'invalid'
  });

  expect(metadata.format).toBe('pmtiles');
  expect(metadata.tilejson).toBeUndefined();
  expect(metadata.attributions).toEqual([]);
});
