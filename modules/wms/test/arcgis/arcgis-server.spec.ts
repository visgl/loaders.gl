// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {
  _ArcGISFeatureServerSourceLoader as ArcGISFeatureServerSourceLoader,
  _ArcGISImageServerSourceLoader as ArcGISImageServerSourceLoader
} from '@loaders.gl/wms';

const IMAGE_SERVER_URL = 'https://example.com/arcgis/rest/services/Imagery/ImageServer';
const FEATURE_SERVER_URL = 'https://example.com/arcgis/rest/services/Roads/FeatureServer/0';

test('ArcGISImageServerSourceLoader#testURL', t => {
  t.ok(ArcGISImageServerSourceLoader);
  t.ok(
    ArcGISImageServerSourceLoader.testURL(IMAGE_SERVER_URL),
    'identifies ArcGIS ImageServer URLs'
  );
  t.end();
});

test('ArcGISImageSource#metadataURL', t => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});

  const metadataUrl = new URL(source.metadataURL());
  t.equal(metadataUrl.origin + metadataUrl.pathname, IMAGE_SERVER_URL, 'metadata base URL');
  t.equal(metadataUrl.searchParams.get('f'), 'pjson', 'metadata format');
  t.end();
});

test('ArcGISImageSource#exportImageURL', t => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});

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

  t.equal(exportImageUrl.origin + exportImageUrl.pathname, `${IMAGE_SERVER_URL}/exportImage`);
  t.equal(exportImageUrl.searchParams.get('bbox'), '1,2,3,4');
  t.equal(exportImageUrl.searchParams.get('bboxSR'), '4326');
  t.equal(exportImageUrl.searchParams.get('size'), '512,256');
  t.equal(exportImageUrl.searchParams.get('imageSR'), '3857');
  t.equal(exportImageUrl.searchParams.get('format'), 'png');
  t.equal(exportImageUrl.searchParams.get('f'), 'image');
  t.end();
});

test('ArcGISImageSource#getMetadata', async t => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});
  source.fetch = async () =>
    new Response(
      JSON.stringify({
        name: 'Imagery',
        description: 'Image service description',
        keywords: ['raster', 'imagery']
      })
    );

  const metadata = await source.getMetadata();
  t.equal(metadata.name, 'Imagery');
  t.equal(metadata.abstract, 'Image service description');
  t.deepEqual(metadata.keywords, ['raster', 'imagery']);
  t.end();
});

test('ArcGISImageSource#getImage maps generic parameters', async t => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});
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

  t.deepEqual(exportImageParameters, {
    bbox: [1, 2, 3, 4],
    bboxSR: '3857',
    imageSR: '3857',
    width: 512,
    height: 256,
    format: 'png'
  });
  t.end();
});

test('ArcGISImageSource#getImage normalizes EPSG-prefixed spatial references', async t => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});
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
    crs: 'EPSG:3857',
    format: 'image/png',
    layers: []
  });

  t.deepEqual(exportImageParameters, {
    bbox: [1, 2, 3, 4],
    bboxSR: '3857',
    imageSR: '3857',
    width: 512,
    height: 256,
    format: 'png'
  });
  t.end();
});

test('ArcGISFeatureServerSourceLoader#testURL', t => {
  t.ok(ArcGISFeatureServerSourceLoader);
  t.ok(
    ArcGISFeatureServerSourceLoader.testURL(FEATURE_SERVER_URL),
    'identifies ArcGIS FeatureServer URLs'
  );
  t.end();
});

test('ArcGISVectorSource#metadataURL', t => {
  const source = ArcGISFeatureServerSourceLoader.createDataSource(FEATURE_SERVER_URL, {});

  const metadataUrl = new URL(source.metadataURL());
  t.equal(metadataUrl.origin + metadataUrl.pathname, FEATURE_SERVER_URL, 'metadata base URL');
  t.equal(metadataUrl.searchParams.get('f'), 'pjson', 'metadata format');
  t.end();
});

test('ArcGISVectorSource#getFeaturesURL', t => {
  const source = ArcGISFeatureServerSourceLoader.createDataSource(FEATURE_SERVER_URL, {});
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

  t.equal(featuresUrl.origin + featuresUrl.pathname, `${FEATURE_SERVER_URL}/query`);
  t.equal(featuresUrl.searchParams.get('returnGeometry'), 'true');
  t.equal(featuresUrl.searchParams.get('where'), '1=1');
  t.equal(featuresUrl.searchParams.get('outFields'), '*');
  t.equal(featuresUrl.searchParams.get('outSR'), '3857');
  t.equal(featuresUrl.searchParams.get('inSR'), '3857');
  t.equal(featuresUrl.searchParams.get('geometry'), '1,2,3,4');
  t.equal(featuresUrl.searchParams.get('geometryType'), 'esriGeometryEnvelope');
  t.equal(featuresUrl.searchParams.get('spatialRel'), 'esriSpatialRelIntersects');
  t.equal(featuresUrl.searchParams.get('f'), 'geojson');
  t.end();
});

test('ArcGISVectorSource#getFeaturesURL normalizes EPSG-prefixed spatial references', t => {
  const source = ArcGISFeatureServerSourceLoader.createDataSource(FEATURE_SERVER_URL, {});
  const featuresUrl = new URL(
    source.getFeaturesURL({
      boundingBox: [
        [1, 2],
        [3, 4]
      ],
      layers: [],
      crs: 'EPSG:3857'
    })
  );

  t.equal(featuresUrl.searchParams.get('outSR'), '3857');
  t.equal(featuresUrl.searchParams.get('inSR'), '3857');
  t.end();
});

test('ArcGISVectorSource#getMetadata and getSchema', async t => {
  const source = ArcGISFeatureServerSourceLoader.createDataSource(FEATURE_SERVER_URL, {});
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
  t.equal(metadata.name, 'Roads');
  t.equal(metadata.abstract, 'Road centerlines');
  t.deepEqual(metadata.layers, [{name: 'Road centerlines'}]);
  t.ok(metadata.formatSpecificMetadata, 'preserves format-specific metadata when requested');

  const schema = await source.getSchema();
  t.deepEqual(schema.fields, [
    {name: 'OBJECTID', type: 'int32', nullable: false},
    {name: 'NAME', type: 'utf8', nullable: true},
    {name: 'LENGTH', type: 'float64', nullable: true}
  ]);
  t.end();
});

test('ArcGISVectorSource#getFeatures', async t => {
  const source = ArcGISFeatureServerSourceLoader.createDataSource(FEATURE_SERVER_URL, {});
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

  t.deepEqual(table, {
    shape: 'geojson-table',
    ...featureCollection
  });
  t.end();
});
