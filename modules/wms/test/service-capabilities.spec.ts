import {expect, test} from 'vitest';
import {
  normalizeTileServiceCapabilities,
  normalizeVectorServiceCapabilities,
  normalizeWFSCapabilities,
  normalizeWMSCapabilities,
  normalizeWMTSCapabilities
} from '@loaders.gl/wms';

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

test('flattens nested WMS layers and removes duplicate metadata', () => {
  const normalized = normalizeWMSCapabilities({
    name: 'catalog',
    layers: [
      {
        title: 'Group',
        crs: ['EPSG:3857', 'EPSG:3857'],
        layers: [
          {
            name: 'buildings',
            title: 'Buildings',
            crs: ['EPSG:4326'],
            geographicBoundingBox: [
              [0, 1],
              [2, 3]
            ],
            keywords: []
          }
        ],
        keywords: []
      }
    ],
    requests: {GetMap: {mimeTypes: ['image/png', 'image/png']}, GetFeatureInfo: {mimeTypes: []}},
    keywords: []
  });

  expect(normalized.layers).toHaveLength(2);
  expect(normalized.layers[0].name).toBe('');
  expect(normalized.layers[1]).toMatchObject({name: 'buildings', bounds: [0, 1, 2, 3]});
  expect(normalized.crs).toEqual(['EPSG:3857', 'EPSG:4326']);
  expect(normalized.formats).toEqual(['image/png']);
});

test('normalizes WFS, tile, and vector metadata variants', () => {
  const wfs = normalizeWFSCapabilities(
    {
      serviceIdentification: {serviceType: 'WFS', title: 'Features'},
      contents: {layers: [{identifier: 'roads', title: 'Roads', formats: ['geojson', 'geojson']}]},
      operationsMetadata: {GetCapabilities: {}, GetFeature: {}}
    } as any,
    'https://example.com/wfs'
  );
  expect(wfs).toMatchObject({
    type: 'wfs',
    name: 'WFS',
    formats: ['geojson'],
    layers: [{name: 'roads', title: 'Roads'}]
  });

  const tile = normalizeTileServiceCapabilities(
    {
      name: 'satellite',
      title: 'Satellite',
      format: 'image/jpeg',
      layer: {name: 'imagery', title: 'Imagery', srs: ['EPSG:3857']}
    } as any,
    'arcgis-map-server'
  );
  expect(tile).toMatchObject({
    type: 'arcgis-map-server',
    formats: ['image/jpeg'],
    operations: ['GetTile']
  });

  const vector = normalizeVectorServiceCapabilities(
    {
      name: 'roads',
      title: 'Road network',
      abstract: 'Roads',
      layers: [
        {name: 'roads', title: 'Roads', crs: ['EPSG:4326']},
        {name: undefined, title: 'Bridges', crs: ['EPSG:4326', 'EPSG:3857']}
      ],
      formatSpecificMetadata: {source: 'test'}
    } as any,
    'arcgis-feature-server'
  );
  expect(vector).toMatchObject({
    type: 'arcgis-feature-server',
    crs: ['EPSG:4326', 'EPSG:3857'],
    layers: [{name: 'roads'}, {name: ''}],
    operations: ['GetFeature']
  });
});
