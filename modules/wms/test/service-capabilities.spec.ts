import {expect, test} from 'vitest';
import {normalizeWMSCapabilities, normalizeWMTSCapabilities} from '@loaders.gl/wms';

test('normalizes WMS capabilities into shared service metadata', () => {
  const normalized = normalizeWMSCapabilities(
    {
      name: 'maps',
      title: 'Maps',
      keywords: [],
      layers: [
        {
          name: 'roads',
          title: 'Roads',
          keywords: [],
          crs: ['EPSG:3857'],
          geographicBoundingBox: [
            [-1, -2],
            [3, 4]
          ]
        }
      ],
      requests: {GetMap: {mimeTypes: ['image/png']}}
    } as any,
    'https://example.com/wms'
  );
  expect(normalized).toMatchObject({
    type: 'wms',
    name: 'maps',
    url: 'https://example.com/wms',
    crs: ['EPSG:3857'],
    formats: ['image/png']
  });
  expect(normalized.layers[0].bounds).toEqual([-1, -2, 3, 4]);
});

test('normalizes WMTS matrix CRS and formats', () => {
  const normalized = normalizeWMTSCapabilities({
    serviceIdentification: {title: 'Tiles'},
    operationsMetadata: {GetTile: {}},
    contents: {
      layers: [
        {
          identifier: 'roads',
          formats: ['image/png'],
          styles: [],
          tileMatrixSetLinks: [],
          resourceURLs: []
        }
      ],
      tileMatrixSets: [{identifier: 'web', supportedCRS: 'EPSG:3857', matrices: []}]
    }
  });
  expect(normalized.type).toBe('wmts');
  expect(normalized.crs).toEqual(['EPSG:3857']);
  expect(normalized.operations).toEqual(['GetTile']);
});
