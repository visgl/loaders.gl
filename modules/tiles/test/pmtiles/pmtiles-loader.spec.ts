import {expect, test} from 'vitest';
import {load, isBrowser} from '@loaders.gl/core';
import {PMTILESETS_VECTOR} from './data/tilesets';
import {PMTilesLoader} from '@loaders.gl/tiles/pmtiles';
test('PMTilesLoader#schemas', async () => {
  if (!isBrowser) {
    console.log('PMTilesLoaderWithParser currently only supported in browser');
    return;
  }
  for (const tilesetUrl of PMTILESETS_VECTOR) {
    const source = await load(tilesetUrl, PMTilesLoader);
    const fields: any[] = [];
    for (const layer of source.layers) {
      fields.push(...layer.schema.fields);
    }
    expect(fields.length).toBe(66);
  }
});
