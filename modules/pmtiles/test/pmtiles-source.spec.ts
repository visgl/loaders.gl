// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/loader-utils';

import {PMTILESETS} from './data/tilesets';
import {PMTilesSource} from '@loaders.gl/pmtiles';

test('PMTilesSource', async (t) => {
  if (!isBrowser) {
    t.comment('PMTilesSource currently only supported in browser');
    t.end();
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const source = new PMTilesSource({
      url: tilesetUrl
    });
    t.ok(source);
    const metadata = await source.getMetadata();
    t.ok(metadata);
  }
  t.end();
});

// TBA - TILE LOADING TESTS
