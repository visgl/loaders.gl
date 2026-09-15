// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {DEFAULT_TILE_3D_RENDER_CONTRACT} from '../src/tile-3d-render-contract';

test('default 3D Tiles render contract exposes ordered content and metadata', () => {
  const contentEntry = {
    index: 0,
    payload: {id: 'mesh'},
    metadata: {class: 'Building'},
    boundingVolume: null,
    featureIds: [{source: 'constant' as const, constant: 7}],
    renderable: true
  };
  const tile = {
    contentEntries: [contentEntry],
    metadataContext: {tile: {id: 'tile-0'}},
    contentVisibility: (_frameState: unknown, contentIndex?: number) =>
      contentIndex === 0 ? 'inside' : 'intersecting'
  } as any;

  expect(DEFAULT_TILE_3D_RENDER_CONTRACT.getContentEntries(tile)).toEqual([contentEntry]);
  expect(DEFAULT_TILE_3D_RENDER_CONTRACT.getFeatureIds(contentEntry)).toEqual(contentEntry.featureIds);
  expect(DEFAULT_TILE_3D_RENDER_CONTRACT.getMetadata(tile)).toEqual(tile.metadataContext);
  expect(DEFAULT_TILE_3D_RENDER_CONTRACT.getVisibility(tile, {} as any)).toBe('intersecting');
  expect(DEFAULT_TILE_3D_RENDER_CONTRACT.getVisibility(tile, {} as any, 0)).toBe('inside');
});
