// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  createArcGISCredential,
  createCesiumIonCredential,
  createGoogleMapsCredential,
  createMapboxCredential
} from '@loaders.gl/services';

describe('service authentication presets', () => {
  test('uses provider-specific credential placement and origins', () => {
    expect(
      createArcGISCredential({token: 'arcgis', origins: ['https://enterprise.example.com']})
    ).toMatchObject({
      type: 'query-parameter',
      name: 'token',
      origins: ['https://enterprise.example.com'],
      refreshStatusCodes: [401, 403, 498, 499]
    });
    expect(createMapboxCredential({accessToken: 'mapbox'})).toMatchObject({
      type: 'query-parameter',
      name: 'access_token',
      origins: ['https://api.mapbox.com']
    });
    expect(createGoogleMapsCredential({apiKey: 'google'})).toMatchObject({
      type: 'query-parameter',
      name: 'key',
      origins: ['https://tile.googleapis.com']
    });
    expect(createCesiumIonCredential({accessToken: 'ion'})).toMatchObject({
      type: 'header',
      name: 'Authorization',
      prefix: 'Bearer ',
      origins: ['https://api.cesium.com']
    });
  });
});
