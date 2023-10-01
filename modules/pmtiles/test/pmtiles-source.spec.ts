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
  }
  t.end();
});

// TBA - TILE LOADING TESTS
