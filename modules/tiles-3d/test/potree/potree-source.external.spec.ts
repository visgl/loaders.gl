// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createDataSource} from '@loaders.gl/core';
import {expect, test} from 'vitest';
import {PotreeLoader} from '@loaders.gl/tiles-3d/potree';

const POTREE_LAZ_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted';

test('PotreeLoader#derives cartographic view metadata from the remote dataset', async () => {
  const source = await createDataSource(POTREE_LAZ_URL, PotreeLoader, {});
  const metadata = await source.getMetadata();
  const viewState = source.getViewState();

  expect(Array.isArray(metadata.viewState.cartographicCenter)).toBe(true);
  expect(metadata.viewState.zoom || 0).toBeGreaterThan(0);
  expect(metadata.viewState.cartographicCenter).toEqual(viewState.cartographicCenter);
});
