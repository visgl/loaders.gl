// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {
  _ArcGISFeatureServerSource as ArcGISFeatureServerSource,
  _ArcGISImageServerSource as ArcGISImageServerSource
} from '@loaders.gl/wms';

const IMAGE_SERVER_URL = 'https://example.com/arcgis/rest/services/Imagery/ImageServer';
const FEATURE_SERVER_URL = 'https://example.com/arcgis/rest/services/Roads/FeatureServer/0';

test('ArcGISImageServerSource#testURL', () => {
  expect(ArcGISImageServerSource).toBeTruthy();
  expect(
    ArcGISImageServerSource.testURL(IMAGE_SERVER_URL),
    'identifies ArcGIS ImageServer URLs'
  ).toBeTruthy();
});

test('ArcGISImageSource#metadataURL', () => {
  const source = ArcGISImageServerSource.createDataSource(IMAGE_SERVER_URL, {});

  const metadataUrl = new URL(source.metadataURL());
  expect(metadataUrl.origin + metadataUrl.pathname, 'metadata base URL').toBe(IMAGE_SERVER_URL);
  expect(metadataUrl.searchParams.get('f'), 'metadata format').toBe('pjson');
});

test('ArcGISImageSource#exportImageURL', () => {
  const source = ArcGISImageServerSource.createDataSource(IMAGE_SERVER_URL, {});

  const exportImageUrl = new URL(
    source.exportImageURL({
      bbox: [1, 2, 3, 4],
      bboxSR: 4326,
      width: 512,
      height: 256,
      imageSR: 3857,
      format: 'png'
    })
  );

  expect(exportImageUrl.origin + exportImageUrl.pathname).toBe(`${IMAGE_SERVER_URL}/exportImage`);
  expect(exportImageUrl.searchParams.get('bbox')).toBe('1,2,3,4');
  expect(exportImageUrl.searchParams.get('bboxSR')).toBe('4326');
  expect(exportImageUrl.searchParams.get('size')).toBe('512,256');
  expect(exportImageUrl.searchParams.get('imageSR')).toBe('3857');
  expect(exportImageUrl.searchParams.get('format')).toBe('png');
  expect(exportImageUrl.searchParams.get('f')).toBe('image');
});

test('ArcGISImageSource#getMetadata', async () => {
  const source = ArcGISImageServerSource.createDataSource(IMAGE_SERVER_URL, {});
  source.fetch = async () =>
    new Response(
      JSON.stringify({
        name: 'Imagery',
        description: 'Image service description',
        keywords: ['raster', 'imagery']
      })
    );

  const metadata = await source.getMetadata();
  expect(metadata.name).toBe('Imagery');
  expect(metadata.abstract).toBe('Image service description');
  expect(metadata.keywords).toEqual(['raster', 'imagery']);
});

test('ArcGISImageSource#getImage maps generic parameters', async () => {
  const source = ArcGISImageServerSource.createDataSource(IMAGE_SERVER_URL, {});
  let exportImageParameters;
  source.exportImage = async parameters => {
    exportImageParameters = parameters;
    return {} as never;
  };

  await source.getImage({
    boundingBox: [
      [1, 2],
      [3, 4]
    ],
    width: 512,
    height: 256,
    crs: '3857',
    format: 'image/png',
    layers: []
  });

  expect(exportImageParameters).toEqual({
    bbox: [1, 2, 3, 4],
    bboxSR: '3857',
    imageSR: '3857',
    width: 512,
    height: 256,
    format: 'png'
  });
});

test('ArcGISFeatureServerSource#testURL', () => {
  expect(ArcGISFeatureServerSource).toBeTruthy();
  expect(
    ArcGISFeatureServerSource.testURL(FEATURE_SERVER_URL),
    'identifies ArcGIS FeatureServer URLs'
  ).toBeTruthy();
});

test('ArcGISVectorSource#metadataURL', () => {
  const source = ArcGISFeatureServerSource.createDataSource(FEATURE_SERVER_URL, {});

  const metadataUrl = new URL(source.metadataURL());
  expect(metadataUrl.origin + metadataUrl.pathname, 'metadata base URL').toBe(FEATURE_SERVER_URL);
  expect(metadataUrl.searchParams.get('f'), 'metadata format').toBe('pjson');
});

test('ArcGISVectorSource#getFeaturesURL', () => {
  const source = ArcGISFeatureServerSource.createDataSource(FEATURE_SERVER_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      boundingBox: [
        [1, 2],
        [3, 4]
      ],
      layers: [],
      crs: '3857'
    })
  );

  expect(featuresUrl.origin + featuresUrl.pathname).toBe(`${FEATURE_SERVER_URL}/query`);
  expect(featuresUrl.searchParams.get('returnGeometry')).toBe('true');
  expect(featuresUrl.searchParams.get('where')).toBe('1=1');
  expect(featuresUrl.searchParams.get('outFields')).toBe('*');
  expect(featuresUrl.searchParams.get('outSR')).toBe('3857');
  expect(featuresUrl.searchParams.get('inSR')).toBe('3857');
  expect(featuresUrl.searchParams.get('geometry')).toBe('1,2,3,4');
  expect(featuresUrl.searchParams.get('geometryType')).toBe('esriGeometryEnvelope');
  expect(featuresUrl.searchParams.get('spatialRel')).toBe('esriSpatialRelIntersects');
  expect(featuresUrl.searchParams.get('f')).toBe('geojson');
});

test('ArcGISVectorSource#getMetadata and getSchema', async () => {
  const source = ArcGISFeatureServerSource.createDataSource(FEATURE_SERVER_URL, {});
  source.fetch = async () =>
    new Response(
      JSON.stringify({
        serviceDescription: 'Roads',
        description: 'Road centerlines',
        layers: [{id: 0, name: 'Road centerlines'}],
        fields: [
          {name: 'OBJECTID', type: 'esriFieldTypeOID', nullable: false},
          {name: 'NAME', type: 'esriFieldTypeString', nullable: true},
          {name: 'LENGTH', type: 'esriFieldTypeDouble', nullable: true}
        ]
      })
    );

  const metadata = await source.getMetadata({formatSpecificMetadata: true});
  expect(metadata.name).toBe('Roads');
  expect(metadata.abstract).toBe('Road centerlines');
  expect(metadata.layers).toEqual([{name: 'Road centerlines'}]);
  expect(
    metadata.formatSpecificMetadata,
    'preserves format-specific metadata when requested'
  ).toBeTruthy();

  const schema = await source.getSchema();
  expect(schema.fields).toEqual([
    {name: 'OBJECTID', type: 'int32', nullable: false},
    {name: 'NAME', type: 'utf8', nullable: true},
    {name: 'LENGTH', type: 'float64', nullable: true}
  ]);
});

test('ArcGISVectorSource#getFeatures', async () => {
  const source = ArcGISFeatureServerSource.createDataSource(FEATURE_SERVER_URL, {});
  const featureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'Road'}
      }
    ]
  };
  source.fetch = async () => new Response(JSON.stringify(featureCollection));

  const table = await source.getFeatures({
    boundingBox: [
      [1, 2],
      [3, 4]
    ],
    layers: [],
    crs: '4326'
  });

  expect(table).toEqual({
    shape: 'geojson-table',
    ...featureCollection
  });
});
