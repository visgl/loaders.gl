// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {PMTilesSource} from '@loaders.gl/pmtiles';

import {PMTILESETS} from './data/tilesets';

test('PMTilesSource', async (t) => {
  for (const tilesetUrl of PMTILESETS) {
    const source = new PMTilesSource({
      url: tilesetUrl
    });
    t.ok(source);
    const metadata = await source.getMetadata();
    t.ok(metadata);
  }
});

// TBA - TILE LOADING TESTS
