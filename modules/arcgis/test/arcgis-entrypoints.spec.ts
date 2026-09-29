// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {
  ArcGISFeatureServerSourceLoader,
  ARCGIS_LOADERS,
  getArcGISLoader,
  ArcGISAuthentication,
  createArcGISCredential
} from '@loaders.gl/arcgis';
import {resolveCredentials} from '@loaders.gl/loader-utils';

describe('ArcGIS public entrypoints', () => {
  test('the package root supports synchronous construction and feature queries', async () => {
    const source = createDataSource(
      'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',
      [ArcGISFeatureServerSourceLoader],
      {core: {fetch: async () => Response.json({type: 'FeatureCollection', features: []})}}
    );
    expect(await source.getFeatures({format: 'geojson'})).toMatchObject({
      type: 'FeatureCollection',
      features: []
    });
  });

  test.each([
    ['arcgis-feature-server', 'Roads/FeatureServer/0'],
    ['arcgis-image-server', 'Imagery/ImageServer'],
    ['arcgis-image-server-tiles', 'Imagery/ImageServer'],
    ['arcgis-map-server', 'Basemap/MapServer'],
    ['arcgis-vector-tile-server', 'Basemap/VectorTileServer'],
    ['arcgis-scene-server', 'City/SceneServer/layers/0']
  ])('%s preserves URL detection, construction and scoped authentication', async (serviceType, endpoint) => {
    const serviceUrl = `https://enterprise.example.com/arcgis/rest/services/${endpoint}`;
    const loader = getArcGISLoader(serviceType)!;
    expect(loader.testURL(serviceUrl)).toBe(true);
    expect(loader.testURL('https://example.com/unrelated')).toBe(false);

    const requests: string[] = [];
    const source = createDataSource(serviceUrl, ARCGIS_LOADERS, {
      core: {
        type: serviceType,
        credentials: [
          {type: 'arcgis', origins: ['https://enterprise.example.com'], token: 'scoped-token'}
        ],
        fetch: async url => {
          requests.push(String(url));
          return Response.json({});
        }
      }
    });
    expect(requests).toEqual([]);
    await source.fetch(serviceUrl);
    // Both requests use the in-memory core.fetch above; only the origin differs.
    const untrustedUrl = new URL(serviceUrl);
    untrustedUrl.hostname = 'untrusted.example.com';
    await source.fetch(untrustedUrl.href);
    expect(new URL(requests[0]).searchParams.get('token')).toBe('scoped-token');
    expect(new URL(requests[1]).searchParams.has('token')).toBe(false);
  });

  test('the ArcGIS credential preset retains its scope and refresh statuses', () => {
    const options = {token: 'token', origins: ['https://enterprise.example.com']};
    expect(createArcGISCredential(options)).toMatchObject({
      type: 'query-parameter',
      name: 'token',
      origins: options.origins,
      refreshStatusCodes: [401, 403, 498, 499]
    });
    expect(
      resolveCredentials([{type: 'arcgis', ...options}], [ArcGISAuthentication])
    ).toMatchObject([createArcGISCredential(options)]);
  });
});
