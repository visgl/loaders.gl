// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {SpatialDataSource, SpatialDataSourceLoader} from '@loaders.gl/zarr';

const FIXTURE_URL = '/modules/zarr/test/data/spatialdata-v3.zarr';

describe('SpatialDataSource browser integration', () => {
  test('discovers the typed SpatialData catalog through createDataSource', async () => {
    const source = createDataSource(FIXTURE_URL, [SpatialDataSourceLoader]);
    const metadata = await source.getMetadata();

    expect(source).toBeInstanceOf(SpatialDataSource);
    expect(metadata.images.map(element => element.name)).toEqual(['example-image']);
    expect(metadata.labels.map(element => element.name)).toEqual(['nuclei']);
    expect(metadata.points.map(element => element.name)).toEqual(['transcripts']);
    expect(metadata.shapes.map(element => element.name)).toEqual(['cells']);
    expect(metadata.tables.map(element => element.name)).toEqual(['annotations']);
  });
});
