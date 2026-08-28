import {expect, test} from 'vitest';
import {isBrowser, load} from '@loaders.gl/core';
import {PMTILESETS_VECTOR} from './data/tilesets';
import {_PMTilesLoader as PMTilesLoader} from '@loaders.gl/pmtiles';
test('PMTilesLoader#schemas', async () => {
  if (!isBrowser) {
    console.log('PMTilesSourceLoader currently only supported in browser');
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
