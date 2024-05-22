// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {isBrowser, load} from '@loaders.gl/core';

import {PMTILESETS_VECTOR} from './data/tilesets';
import {_PMTilesLoader as PMTilesLoader} from '@loaders.gl/pmtiles';

test('PMTilesLoader#schemas', async (t) => {
  if (!isBrowser) {
    t.comment('PMTilesSource currently only supported in browser');
    t.end();
    return;
  }
  for (const tilesetUrl of PMTILESETS_VECTOR) {
    const source = await load(tilesetUrl, PMTilesLoader);
    const fields: any[] = [];
    for (const layer of source.layers) {
      fields.push(...layer.schema.fields);
    }
    t.equal(fields.length, 66);
  }
  t.end();
});
