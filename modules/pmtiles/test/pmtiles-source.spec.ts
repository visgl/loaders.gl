// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {isBrowser, fetchFile} from '@loaders.gl/core';

import {PMTILESETS} from './data/tilesets';
import {PMTilesSource} from '@loaders.gl/pmtiles';

test('PMTilesSource#urls', async (t) => {
  if (!isBrowser) {
    t.comment('PMTilesSource currently only supported in browser');
    t.end();
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const source = new PMTilesSource({url: tilesetUrl});
    t.ok(source);
    const metadata = await source.getMetadata();
    t.ok(metadata);
    // console.error(JSON.stringify(metadata.tileJSON, null, 2));
  }
  t.end();
});

test('PMTilesSource#Blobs', async (t) => {
  if (!isBrowser) {
    t.comment('PMTilesSource currently only supported in browser');
    t.end();
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const response = await fetchFile(tilesetUrl);
    const blob = await response.blob();
    const source = new PMTilesSource({url: blob});
    t.ok(source);
    const metadata = await source.getMetadata();
    t.ok(metadata);
    // console.error(JSON.stringify(metadata.tileJSON, null, 2));
  }
  t.end();
});

// TBA - TILE LOADING TESTS

/*
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load} from '@loaders.gl/core';
import {PMTilesLoader} from '@loaders.gl/pmtiles';

import {PMTILESETS} from './data/tilesets';

test('PMTilesLoader#loader conformance', (t) => {
  validateLoader(t, PMTilesLoader, 'PMTilesLoader');
  t.end();
});

test.skip('PMTilesLoader#load', async (t) => {
  for (const tilesetUrl of PMTILESETS) {
    const metadata = await load(tilesetUrl, PMTilesLoader);
    t.ok(metadata);
  }
  t.end();
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
    t.ok(v.lastUsed > 0);
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
  t.ok(cache.cache.get('2'));
  t.ok(cache.cache.get('1'));
  t.ok(!cache.cache.get('0'));
});

test('pmtiles get metadata', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  const p = new PMTiles(source);
  const metadata = await p.getMetadata();
  t.ok(metadata.name);
});

// echo '{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,0],[0,0]]]}' | ./tippecanoe -zg -o test_fixture_2.pmtiles
test('pmtiles handle retries', async (t) => {
  const source = new TestFileSource('@loaders.gl/pmtiles/test/data/test_fixture_1.pmtiles', '1');
  source.etag = '1';
  const p = new PMTiles(source);
  const metadata = await p.getMetadata();
  t.ok(metadata.name);
  source.etag = '2';
  source.replaceData('@loaders.gl/pmtiles/test/data/test_fixture_2.pmtiles');
  t.ok(await p.getZxy(0, 0, 0));
});
*/
