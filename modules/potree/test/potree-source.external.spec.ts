// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PotreeSourceLoader} from '@loaders.gl/potree';

const POTREE_LAZ_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted';

test('PotreeSourceLoader#derives cartographic view metadata from the remote dataset', async () => {
  const source = PotreeSourceLoader.createDataSource(POTREE_LAZ_URL, {});
  const metadata = await source.getMetadata();
  const viewState = source.getViewState();

  expect(Array.isArray(metadata.viewState.cartographicCenter)).toBe(true);
  expect(metadata.viewState.zoom || 0).toBeGreaterThan(0);
  expect(metadata.viewState.cartographicCenter).toEqual(viewState.cartographicCenter);
});
