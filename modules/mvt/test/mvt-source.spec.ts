// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';

import {TILESETS} from './data/tilesets';
import {MVTSource} from '@loaders.gl/mvt';
import {isURLTemplate, getURLFromTemplate} from '../src/mvt-source';

test.skipIf(!isBrowser)('MVTSource#urls', async () => {
  for (const tilesetUrl of TILESETS) {
    const source = new MVTSource({url: tilesetUrl});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
    // console.error(JSON.stringify(metadata.tileJSON, null, 2));
  }
});

test.skipIf(!isBrowser)('MVTSource#Blobs', async () => {
  for (const tilesetUrl of TILESETS) {
    const source = new MVTSource({url: tilesetUrl});
    expect(source).toBeTruthy();
    const metadata = await source.getMetadata();
    expect(metadata).toBeTruthy();
    // console.error(JSON.stringify(metadata.tileJSON, null, 2));
  }
});

const TEST_TEMPLATE = 'https://server.com/{z}/{x}/{y}.png';
const TEST_TEMPLATE2 = 'https://server.com/{z}/{x}/{y}/{x}-{y}-{z}.png';
const TEST_TEMPLATE_ARRAY = [
  'https://server.com/ep1/{x}/{y}.png',
  'https://server.com/ep2/{x}/{y}.png'
];

test('isURLFromTemplate', () => {
  expect(isURLTemplate(TEST_TEMPLATE), 'single string template').toBe(true);
  expect(isURLTemplate(TEST_TEMPLATE2), 'single string template with multiple occurance').toBe(
    true
  );
  // t.true(isURLTemplate(TEST_TEMPLATE_ARRAY), 'array of templates');
});

test('getURLFromTemplate', () => {
  expect(
    getURLFromTemplate(TEST_TEMPLATE, 1, 2, 0),
    'single string template'
  ).toBe('https://server.com/0/1/2.png');
  expect(
    getURLFromTemplate(TEST_TEMPLATE2, 1, 2, 0),
    'single string template with multiple occurance'
  ).toBe('https://server.com/0/1/2/1-2-0.png');
  expect(
    getURLFromTemplate(TEST_TEMPLATE_ARRAY, 1, 2, 0, '1-2-0'),
    'array of templates'
  ).toBe('https://server.com/ep2/1/2.png');
  expect(
    getURLFromTemplate(TEST_TEMPLATE_ARRAY, 2, 2, 0, '2-2-0'),
    'array of templates'
  ).toBe('https://server.com/ep1/2/2.png');
  expect(
    getURLFromTemplate(TEST_TEMPLATE_ARRAY, 17, 11, 5, '17-11-5'),
    'array of templates'
  ).toBe('https://server.com/ep2/17/11.png');
  // t.is(getURLFromTemplate(null, 1, 2, 0), null, 'invalid template');
  // t.is(getURLFromTemplate([], 1, 2, 0), null, 'empty array');
});

// TBA - TILE LOADING TESTS

/*
import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';

import {load} from '@loaders.gl/core';
import {PMTilesLoader} from '@loaders.gl/pmtiles';

import {PMTILESETS} from './data/tilesets';

test('PMTilesLoader#loader conformance', (t) => {
  validateLoader(t, PMTilesLoader, 'PMTilesLoader');
  
});

test.skip('PMTilesLoader#load', async (t) => {
  for (const tilesetUrl of PMTILESETS) {
    const metadata = await load(tilesetUrl, PMTilesLoader);
    expect(metadata).toBeTruthy();
  }
  
});

/*
// echo '{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[1,0],[0,0]]]}' | ./tippecanoe -zg -o test_fixture_1.pmtiles
test('cache getHeader', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  const cache = new SharedPromiseCache();
  const header = await cache.getHeader(source);
  t.strictEqual(header.rootDirectoryOffset, 127);
  t.strictEqual(header.rootDirectoryLength, 25);
  t.strictEqual(header.jsonMetadataOffset, 152);
  t.strictEqual(header.jsonMetadataLength, 247);
  t.strictEqual(header.leafDirectoryOffset, 0);
  t.strictEqual(header.leafDirectoryLength, 0);
  t.strictEqual(header.tileDataOffset, 399);
  t.strictEqual(header.tileDataLength, 69);
  t.strictEqual(header.numAddressedTiles, 1);
  t.strictEqual(header.numTileEntries, 1);
  t.strictEqual(header.numTileContents, 1);
  t.strictEqual(header.clustered, false);
  t.strictEqual(header.internalCompression, 2);
  t.strictEqual(header.tileCompression, 2);
  t.strictEqual(header.tileType, 1);
  t.strictEqual(header.minZoom, 0);
  t.strictEqual(header.maxZoom, 0);
  t.strictEqual(header.minLon, 0);
  t.strictEqual(header.minLat, 0);
  // t.strictEqual(header.maxLon,1); // TODO fix me
  t.strictEqual(header.maxLat, 1);
});

test('cache check against empty', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/empty.pmtiles', '1');
  const cache = new SharedPromiseCache();
  t.rejects(async () => {
    await cache.getHeader(source);
  });
});

test('cache check magic number', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/invalid.pmtiles', '1');
  const cache = new SharedPromiseCache();
  t.rejects(async () => {
    await cache.getHeader(source);
  });
});

test('cache check future spec version', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/invalid_v4.pmtiles', '1');
  const cache = new SharedPromiseCache();
  t.rejects(async () => {
    await cache.getHeader(source);
  });
});

test('cache getDirectory', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');

  let cache = new SharedPromiseCache(6400, false);
  let header = await cache.getHeader(source);
  t.strictEqual(cache.cache.size, 1);

  cache = new SharedPromiseCache(6400, true);
  header = await cache.getHeader(source);

  // prepopulates the root directory
  t.strictEqual(cache.cache.size, 2);

  const directory = await cache.getDirectory(
    source,
    header.rootDirectoryOffset,
    header.rootDirectoryLength,
    header
  );
  t.strictEqual(directory.length, 1);
  t.strictEqual(directory[0].tileId, 0);
  t.strictEqual(directory[0].offset, 0);
  t.strictEqual(directory[0].length, 69);
  t.strictEqual(directory[0].runLength, 1);

  for (const v of cache.cache.values()) {
    expect(v.lastUsed > 0).toBeTruthy();
  }
});

test('multiple sources in a single cache', async (t) => {
  const cache = new SharedPromiseCache();
  const source1 = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  const source2 = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '2');
  await cache.getHeader(source1);
  t.strictEqual(cache.cache.size, 2);
  await cache.getHeader(source2);
  t.strictEqual(cache.cache.size, 4);
});

test('etags are part of key', async (t) => {
  const cache = new SharedPromiseCache(6400, false);
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  source.etag = 'etag_1';
  let header = await cache.getHeader(source);
  t.strictEqual(header.etag, 'etag_1');

  source.etag = 'etag_2';

  t.rejects(async () => {
    await cache.getDirectory(
      source,
      header.rootDirectoryOffset,
      header.rootDirectoryLength,
      header
    );
  });

  cache.invalidate(source, 'etag_2');
  header = await cache.getHeader(source);
  t.ok(
    await cache.getDirectory(source, header.rootDirectoryOffset, header.rootDirectoryLength, header)
  );
});

test.skip('soft failure on etag weirdness', async (t) => {
  const cache = new SharedPromiseCache(6400, false);
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  source.etag = 'etag_1';
  let header = await cache.getHeader(source);
  t.strictEqual(header.etag, 'etag_1');

  source.etag = 'etag_2';

  t.rejects(async () => {
    await cache.getDirectory(
      source,
      header.rootDirectoryOffset,
      header.rootDirectoryLength,
      header
    );
  });

  source.etag = 'etag_1';
  cache.invalidate(source, 'etag_2');

  header = await cache.getHeader(source);
  t.strictEqual(header.etag, undefined);
});

test('cache pruning by byte size', async (t) => {
  const cache = new SharedPromiseCache(2, false);
  cache.cache.set('0', {lastUsed: 0, data: Promise.resolve([])});
  cache.cache.set('1', {lastUsed: 1, data: Promise.resolve([])});
  cache.cache.set('2', {lastUsed: 2, data: Promise.resolve([])});
  cache.prune();
  t.strictEqual(cache.cache.size, 2);
  expect(cache.cache.get('2')).toBeTruthy();
  expect(cache.cache.get('1')).toBeTruthy();
  expect(!cache.cache.get('0')).toBeTruthy();
});

test('pmtiles get metadata', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  const p = new PMTiles(source);
  const metadata = await p.getMetadata();
  expect(metadata.name).toBeTruthy();
});

// echo '{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,0],[0,0]]]}' | ./tippecanoe -zg -o test_fixture_2.pmtiles
test('pmtiles handle retries', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  source.etag = '1';
  const p = new PMTiles(source);
  const metadata = await p.getMetadata();
  expect(metadata.name).toBeTruthy();
  source.etag = '2';
  source.replaceData('@loaders.gl/pmtiles/test/data/test_fixture_2.pmtiles');
  expect(await p.getZxy(0, 0, 0)).toBeTruthy();
});
*/
