// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {resolveVisualSource} from '../src/source-layer-utils';
import {SERVICE_LOADERS} from '@loaders.gl/services';
import {describe, expect, test} from 'vitest';

describe('SourceLayer service integration', () => {
  test.each([
    ['Roads/FeatureServer/0', 'arcgis-feature-server', 'vector'],
    ['Imagery/ImageServer', 'arcgis-image-server', 'image'],
    ['Imagery/ImageServer', 'arcgis-image-server-tiles', 'tile-2d'],
    ['Basemap/MapServer', 'arcgis-map-server', 'tile-2d'],
    ['Basemap/VectorTileServer', 'arcgis-vector-tile-server', 'tile-2d']
  ])('resolves %s as %s to the %s renderer', async (path, sourceType, rendererType) => {
    const resolvedSource = await resolveVisualSource({
      data: `https://example.com/arcgis/rest/services/${path}`,
      loaders: SERVICE_LOADERS,
      sourceOptions: {core: {type: sourceType}}
    });

    expect(resolvedSource.sourceLoader?.type).toBe(sourceType);
    expect(resolvedSource.sourceType).toBe(rendererType);
  });
});
