// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import {COPCSourceLoader} from '@loaders.gl/copc';
import {expect, test} from 'vitest';

const COPC_FILE_PATH = 'modules/copc/test/data/ellipsoid.copc.laz';

test('COPCSourceLoader reads local files through the native range reader', async () => {
  const source = COPCSourceLoader.createDataSource(COPC_FILE_PATH, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.loadTileContent(rootTile);

  expect(rootTile.pointCount).toBeGreaterThan(0);
  expect(content?.pointCount).toBe(rootTile.pointCount);
  expect(content?.data.data.getChild('POSITION')?.length).toBe(rootTile.pointCount);
});
