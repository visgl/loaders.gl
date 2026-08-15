// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {MVTLoader} from '@loaders.gl/mvt';
import type {Feature} from '@loaders.gl/schema';

const WITH_FEATURE_ID = '@loaders.gl/mvt/test/data/mvt/with_feature_id.mvt';

let features: Feature[] = [];

beforeAll(async () => {
  const response = await fetchFile(WITH_FEATURE_ID);
  const mvtArrayBuffer = await response.arrayBuffer();
  const geojsonTable = await parse(mvtArrayBuffer, MVTLoader, {
    worker: false,
    mvt: {shape: 'geojson-table'}
  });

  features = geojsonTable.features;
});

test('MVTLoader preserves feature IDs as top-level GeoJSON members', () => {
  expect(features.length).toBeGreaterThan(0);

  for (const feature of features) {
    expect(feature.id).toBeDefined();
    expect(feature.properties ?? {}).not.toHaveProperty('id');
  }
});
