// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {expect, test as vitestTest} from 'vitest';

import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSource,
  ArcGISMapTileSource
} from '@loaders.gl/services';

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

test('ArcGISMapTileSource#getTileURL preserves endpoint parameters', t => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer?token=abc');
  const url = new URL(source.getTileURL({x: 3, y: 4, z: 5}));
  t.equal(url.pathname, '/MapServer/tile/5/4/3');
  t.equal(url.searchParams.get('token'), 'abc');
  t.end();
});

vitestTest('ArcGISMapTileSource builds dynamic export tiles and updates parameters', () => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer', {
    'arcgis-map-server': {mode: 'dynamic', tileSize: 512}
  });
  source.updateParameters({layers: 'show:0', format: 'jpgpng'});
  const url = new URL(source.getExportTileURL({x: 1, y: 2, z: 3}));
  expect(url.pathname).toBe('/MapServer/export');
  expect(url.searchParams.get('size')).toBe('512,512');
  expect(url.searchParams.get('layers')).toBe('show:0');
  expect(url.searchParams.get('format')).toBe('jpgpng');
});

vitestTest('ArcGISMapTileSource distributes requests across configured service URLs', () => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer', {
    'arcgis-map-server': {
      urls: ['https://tiles-a.example.com/MapServer', 'https://tiles-b.example.com/MapServer']
    }
  });
  const url = new URL(source.getTileURL({x: 1, y: 0, z: 0}));
  expect(url.origin).toBe('https://tiles-b.example.com');
});

vitestTest('ArcGISImageTileSource builds exportImage tile requests', () => {
  const source = new ArcGISImageTileSource('https://example.com/ImageServer', {
    'arcgis-image-server-tiles': {tileSize: 512, parameters: {time: '2020-01-01'}}
  });
  source.updateParameters({renderingRule: '{"rasterFunction":"Hillshade"}'});
  const url = new URL(source.getTileURL({x: 0, y: 0, z: 0}));
  expect(url.pathname).toBe('/ImageServer/exportImage');
  expect(url.searchParams.get('size')).toBe('512,512');
  expect(url.searchParams.get('time')).toBe('2020-01-01');
  expect(url.searchParams.get('renderingRule')).toBe('{"rasterFunction":"Hillshade"}');
});

vitestTest('ArcGISImageTileSource distributes requests across configured service URLs', () => {
  const source = new ArcGISImageTileSource('https://example.com/ImageServer', {
    'arcgis-image-server-tiles': {
      urls: [
        'https://imagery-a.example.com/ImageServer',
        'https://imagery-b.example.com/ImageServer'
      ]
    }
  });
  const url = new URL(source.getTileURL({x: 1, y: 0, z: 0}));
  expect(url.origin).toBe('https://imagery-b.example.com');
});

vitestTest('ArcGISImageTileSource parses the effective response format', () => {
  const source = new ArcGISImageTileSource('https://example.com/ImageServer', {
    'arcgis-image-server-tiles': {format: 'lerc', parameters: {format: 'png32'}}
  });
  expect(new URL(source.getTileURL({x: 0, y: 0, z: 0})).searchParams.get('format')).toBe('png32');
  expect(source.mimeType).toBe('image/png');
  source.updateParameters({format: 'png32'});
  expect(new URL(source.getTileURL({x: 0, y: 0, z: 0})).searchParams.get('format')).toBe('png32');
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

vitestTest('ArcGISImageSource#exportImageURL supports LERC analytical rasters', () => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});
  const exportRasterUrl = new URL(
    source.exportImageURL({
      bbox: [1, 2, 3, 4],
      width: 128,
      height: 128,
      format: 'lerc',
      pixelType: 'F32'
    })
  );
  expect(exportRasterUrl.searchParams.get('format')).toBe('lerc');
  expect(exportRasterUrl.searchParams.get('pixelType')).toBe('F32');
});

vitestTest('ArcGISImageSource#exportRaster requests and returns typed raster data', async () => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});
  const raster = {
    width: 2,
    height: 1,
    pixelType: 'F32',
    statistics: [{minValue: 1, maxValue: 2}],
    pixels: [new Float32Array([1, 2])],
    mask: null,
    depthCount: 1
  };
  let parsedLoader;
  source.fetch = async url => {
    const requestURL = new URL(url);
    expect(requestURL.pathname).toBe('/arcgis/rest/services/Imagery/ImageServer/exportImage');
    expect(requestURL.searchParams.get('format')).toBe('lerc');
    expect(requestURL.searchParams.get('pixelType')).toBe('F32');
    return new Response(new Uint8Array([1, 2, 3]));
  };
  source.coreApi.parse = async (_data, loader) => {
    parsedLoader = loader;
    return raster;
  };

  const result = await source.exportRaster({
    bbox: [1, 2, 3, 4],
    width: 2,
    height: 1,
    pixelType: 'F32'
  });

  expect(parsedLoader).toBeDefined();
  expect(result).toBe(raster);
  expect(result.pixels[0]).toBeInstanceOf(Float32Array);
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

test('ArcGISVectorSource#getFeatures defaults to Arrow', async t => {
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

  t.equal(table.shape, 'arrow-table', 'returns Arrow tables by default');
  t.equal(table.data.numRows, 1, 'preserves feature rows');
  t.ok(table.schema?.metadata?.geo, 'adds GeoArrow metadata');
  t.end();
});

test('ArcGISVectorSource#getFeatures supports explicit GeoJSON', async t => {
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
    crs: '4326',
    format: 'geojson'
  });

  t.deepEqual(table, {shape: 'geojson-table', ...featureCollection});
  t.end();
});
