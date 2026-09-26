// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createDataSource, load} from '@loaders.gl/core';
import {ARCGIS_LOADERS, ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';
import {ArcGISFeatureServerSourceLoaderWithParser} from '@loaders.gl/arcgis/arcgis-feature-server-source-loader';
import {ArcGISAuthentication, createArcGISCredential} from '@loaders.gl/arcgis/authentication';
import {resolveCredentials} from '@loaders.gl/loader-utils';

describe('ArcGIS public entrypoints', () => {
  test.each(
    ARCGIS_LOADERS.map(loader => [loader.id, loader] as const)
  )('%s loads its runtime asynchronously and rejects synchronous metadata construction', async (_identifier, loader) => {
    const sourceUrl = 'https://example.com/arcgis/rest/services/Test/SceneServer/layers/0';
    expect(() => createDataSource(sourceUrl, [loader], {})).toThrow(/requires async load/);
    const source = await load(sourceUrl, loader);
    expect(typeof source.getMetadata).toBe('function');
    expect(loader.getAuthentications()).toEqual([ArcGISAuthentication]);
  });

  test('the explicit runtime supports synchronous construction and a real query contract', async () => {
    const source = createDataSource(
      'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',
      [ArcGISFeatureServerSourceLoaderWithParser],
      {core: {fetch: async () => Response.json({type: 'FeatureCollection', features: []})}}
    );
    expect(await source.getFeatures({format: 'geojson'})).toMatchObject({
      type: 'FeatureCollection',
      features: []
    });
  });

  test('lazy loading retains declarative authentication for feature requests', async () => {
    const requests: string[] = [];
    const source = await load(
      'https://enterprise.example.com/arcgis/rest/services/Roads/FeatureServer/0',
      ArcGISFeatureServerSourceLoader,
      {
        core: {
          credentials: [
            {type: 'arcgis', origins: ['https://enterprise.example.com'], token: 'scoped-token'}
          ],
          fetch: async url => {
            requests.push(String(url));
            return Response.json({type: 'FeatureCollection', features: []});
          }
        }
      }
    );
    await source.getFeatures({format: 'geojson'});
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0]).searchParams.get('token')).toBe('scoped-token');
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
