// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {isBrowser, load} from '@loaders.gl/core';

import {PMTILESETS} from './data/tilesets';
import {PMTilesLoader} from '@loaders.gl/pmtiles';

test.only('PMTilesLoader#layerSchemas', async (t) => {
  if (!isBrowser) {
    t.comment('PMTilesSource currently only supported in browser');
    t.end();
    return;
  }
  for (const tilesetUrl of PMTILESETS) {
    const source = await load(tilesetUrl, PMTilesLoader);
    debugger
    t.ok(source);
  }
  t.end();
});
