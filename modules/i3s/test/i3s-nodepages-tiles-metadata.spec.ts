// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import I3SNodePagesTiles from '../src/lib/helpers/i3s-nodepages-tiles';
import {TEST_LAYER_URL, TILESET_STUB} from './test-utils/load-utils';

it('I3SNodePagesTiles preserves node-page extension fields', async () => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB(), TEST_LAYER_URL, {});
  const node = {
    index: 0,
    obb: {
      center: [8.67, 50.1, 189],
      halfSize: [10, 20, 30],
      quaternion: [0, 0, 0, 1]
    },
    children: [],
    vendorExtension: {classification: 'historic'}
  };
  i3SNodePagesTiles.nodePages[0] = {nodes: [node]} as any;
  i3SNodePagesTiles.pendingNodePages[0] = {
    status: 'Done',
    promise: Promise.resolve({nodes: [node]})
  };

  const tile = await i3SNodePagesTiles.formTileFromNodePages(0);

  expect((tile as any).vendorExtension).toEqual({classification: 'historic'});
});
