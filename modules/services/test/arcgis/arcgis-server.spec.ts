import {expect, test} from 'vitest';
import {LERCLoader} from '@loaders.gl/lerc';
import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSource,
  ArcGISMapTileSource
} from '@loaders.gl/services';
const IMAGE_SERVER_URL = 'https://example.com/arcgis/rest/services/Imagery/ImageServer';
const FEATURE_SERVER_URL = 'https://example.com/arcgis/rest/services/Roads/FeatureServer/0';
test('ArcGISImageServerSourceLoader#testURL', () => {
  expect(ArcGISImageServerSourceLoader).toBeTruthy();
  expect(
    ArcGISImageServerSourceLoader.testURL(IMAGE_SERVER_URL),
    'identifies ArcGIS ImageServer URLs'
  ).toBeTruthy();
});
test('ArcGISMapTileSource#getTileURL preserves endpoint parameters', () => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer?token=abc');
  const url = new URL(source.getTileURL({x: 3, y: 4, z: 5}));
  expect(url.pathname).toBe('/MapServer/tile/5/4/3');
  expect(url.searchParams.get('token')).toBe('abc');
});
test('ArcGISMapTileSource builds dynamic export tiles and updates parameters', () => {
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
test('ArcGISMapTileSource distributes requests across configured service URLs', () => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer', {
    'arcgis-map-server': {
      urls: ['https://tiles-a.example.com/MapServer', 'https://tiles-b.example.com/MapServer']
    }
  });
  const url = new URL(source.getTileURL({x: 1, y: 0, z: 0}));
  expect(url.origin).toBe('https://tiles-b.example.com');
});
test('ArcGISMapTileSource fetches and decodes cached tiles', async () => {
  let parseCount = 0;
  const source = new ArcGISMapTileSource(
    'https://example.com/MapServer',
    {'arcgis-map-server': {mode: 'cached'}},
    {
      parse: async () => {
        parseCount++;
        return {width: 1, height: 1};
      }
    } as never
  );
  source.fetch = async () => new Response(new Uint8Array([1, 2, 3]));
  expect(await source.getTile({x: 1, y: 2, z: 3})).toEqual({width: 1, height: 1});
  expect(parseCount).toBe(1);
});
test('ArcGISMapTileSource falls back to dynamic export for incompatible caches', async () => {
  const source = new ArcGISMapTileSource(
    'https://example.com/MapServer',
    {
      'arcgis-map-server': {
        mode: 'auto',
        metadata: {tileInfo: {rows: 512, cols: 512}}
      }
    },
    {parse: async () => ({width: 1, height: 1})} as never
  );
  let requestedURL = '';
  source.fetch = async url => {
    requestedURL = url;
    return new Response(new Uint8Array([1]));
  };
  await source.getTile({x: 0, y: 0, z: 0});
  expect(new URL(requestedURL).pathname).toBe('/MapServer/export');
});
test('ArcGISMapTileSource expands custom tile URL templates', () => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer', {
    'arcgis-map-server': {urlTemplate: 'https://tiles.example/{z}/{y}/{x}.png?token=abc'}
  });
  expect(source.getTileURL({x: 3, y: 4, z: 5})).toBe('https://tiles.example/5/4/3.png?token=abc');
});
test('ArcGISMapTileSource exposes its cached tile grid', async () => {
  const source = new ArcGISMapTileSource('https://example.com/MapServer', {
    'arcgis-map-server': {
      metadata: {
        name: 'Basemap',
        spatialReference: {wkid: 3857},
        tileInfo: {
          rows: 256,
          cols: 256,
          origin: {x: -20037508, y: 20037508},
          spatialReference: {wkid: 3857},
          lods: [{level: 0}, {level: 1}]
        }
      }
    }
  });
  expect(await source.getMetadata()).toMatchObject({
    tileGrid: {
      crs: 'EPSG:3857',
      tileSize: [256, 256],
      origin: [-20037508, 20037508],
      matrixIds: ['0', '1']
    }
  });
});
test('ArcGISImageTileSource builds exportImage tile requests', () => {
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
test('ArcGISImageTileSource distributes requests across configured service URLs', () => {
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
test('ArcGISImageTileSource parses the effective response format', () => {
  const source = new ArcGISImageTileSource('https://example.com/ImageServer', {
    'arcgis-image-server-tiles': {format: 'lerc', parameters: {format: 'png32'}}
  });
  expect(new URL(source.getTileURL({x: 0, y: 0, z: 0})).searchParams.get('format')).toBe('png32');
  expect(source.mimeType).toBe('image/png');
  source.updateParameters({format: 'png32'});
  expect(new URL(source.getTileURL({x: 0, y: 0, z: 0})).searchParams.get('format')).toBe('png32');
});
test('ArcGISImageSource#metadataURL', () => {
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {});
  const metadataUrl = new URL(source.metadataURL());
  expect(metadataUrl.origin + metadataUrl.pathname, 'metadata base URL').toBe(IMAGE_SERVER_URL);
  expect(metadataUrl.searchParams.get('f'), 'metadata format').toBe('pjson');
});
test('ArcGISImageSource#exportImageURL', () => {
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
  expect(exportImageUrl.origin + exportImageUrl.pathname).toBe(`${IMAGE_SERVER_URL}/exportImage`);
  expect(exportImageUrl.searchParams.get('bbox')).toBe('1,2,3,4');
  expect(exportImageUrl.searchParams.get('bboxSR')).toBe('4326');
  expect(exportImageUrl.searchParams.get('size')).toBe('512,256');
  expect(exportImageUrl.searchParams.get('imageSR')).toBe('3857');
  expect(exportImageUrl.searchParams.get('format')).toBe('png');
  expect(exportImageUrl.searchParams.get('f')).toBe('image');
});
test('ArcGISImageSource#exportImageURL supports LERC analytical rasters', () => {
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
test('ArcGISImageSource#exportRaster requests and returns typed raster data', async () => {
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
  const source = ArcGISImageServerSourceLoader.createDataSource(
    IMAGE_SERVER_URL,
    {},
    {
      parse: async (_data, loader) => {
        parsedLoader = loader;
        return raster;
      }
    }
  );
  source.fetch = async url => {
    const requestURL = new URL(url);
    expect(requestURL.pathname).toBe('/arcgis/rest/services/Imagery/ImageServer/exportImage');
    expect(requestURL.searchParams.get('format')).toBe('lerc');
    expect(requestURL.searchParams.get('pixelType')).toBe('F32');
    return new Response(new Uint8Array([1, 2, 3]));
  };
  const result = await source.exportRaster({
    bbox: [1, 2, 3, 4],
    width: 2,
    height: 1,
    pixelType: 'F32'
  });
  expect(parsedLoader).toBe(LERCLoader);
  expect(result).toBe(raster);
  expect(result.pixels[0]).toBeInstanceOf(Float32Array);
});
test('ArcGISImageSource#getMetadata', async () => {
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
  expect(metadata.name).toBe('Imagery');
  expect(metadata.abstract).toBe('Image service description');
  expect(metadata.keywords).toEqual(['raster', 'imagery']);
});
test('ArcGISImageSource#getImage maps generic parameters', async () => {
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
  expect(exportImageParameters).toEqual({
    bbox: [1, 2, 3, 4],
    bboxSR: '3857',
    imageSR: '3857',
    width: 512,
    height: 256,
    format: 'png'
  });
});
test('ArcGISImageSource#getImage normalizes EPSG-prefixed spatial references', async () => {
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
  expect(exportImageParameters).toEqual({
    bbox: [1, 2, 3, 4],
    bboxSR: '3857',
    imageSR: '3857',
    width: 512,
    height: 256,
    format: 'png'
  });
});
test('ArcGISFeatureServerSourceLoader#testURL', () => {
  expect(ArcGISFeatureServerSourceLoader).toBeTruthy();
  expect(
    ArcGISFeatureServerSourceLoader.testURL(FEATURE_SERVER_URL),
    'identifies ArcGIS FeatureServer URLs'
  ).toBeTruthy();
});
test('ArcGISVectorSource#metadataURL', () => {
  const source = ArcGISFeatureServerSourceLoader.createDataSource(FEATURE_SERVER_URL, {});
  const metadataUrl = new URL(source.metadataURL());
  expect(metadataUrl.origin + metadataUrl.pathname, 'metadata base URL').toBe(FEATURE_SERVER_URL);
  expect(metadataUrl.searchParams.get('f'), 'metadata format').toBe('pjson');
});
test('ArcGISVectorSource#getFeaturesURL', () => {
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
test('ArcGISVectorSource#getFeaturesURL normalizes EPSG-prefixed spatial references', () => {
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
  expect(featuresUrl.searchParams.get('outSR')).toBe('3857');
  expect(featuresUrl.searchParams.get('inSR')).toBe('3857');
});
test('ArcGISVectorSource#getMetadata and getSchema', async () => {
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
test('ArcGISVectorSource#getFeatures defaults to Arrow', async () => {
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
  expect(table.shape, 'returns Arrow tables by default').toBe('arrow-table');
  expect(table.data.numRows, 'preserves feature rows').toBe(1);
  expect(table.schema?.metadata?.geo, 'adds GeoArrow metadata').toBeTruthy();
});
test('ArcGISVectorSource#getFeatures supports explicit GeoJSON', async () => {
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
  expect(table).toEqual({shape: 'geojson-table', ...featureCollection});
});
