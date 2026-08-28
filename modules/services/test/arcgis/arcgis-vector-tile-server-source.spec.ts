import {expect, test} from 'vitest';
import {ArcGISVectorTileServerSourceLoader} from '@loaders.gl/services';

const VECTOR_TILE_SERVER_URL = 'https://example.com/arcgis/rest/services/World/VectorTileServer';

const SERVICE_METADATA = {
  serviceDescription: 'World vector tiles',
  mapName: 'World',
  tileInfo: {
    format: 'pbf',
    spatialReference: {wkid: 102100, latestWkid: 3857},
    lods: [
      {level: 0, resolution: 156543.033928, scale: 591657527.591555},
      {level: 1, resolution: 78271.516964, scale: 295828763.795777}
    ]
  },
  fullExtent: {xmin: -20037508, ymin: -20037508, xmax: 20037508, ymax: 20037508}
};

test('ArcGISVectorTileServerSource exposes tile metadata and resources', async () => {
  const source = ArcGISVectorTileServerSourceLoader.createDataSource(VECTOR_TILE_SERVER_URL, {});
  source.fetch = async () => new Response(JSON.stringify(SERVICE_METADATA));

  const metadata = await source.getMetadata();
  expect(metadata.name).toBe('World');
  expect(metadata.minZoom).toBe(0);
  expect(metadata.maxZoom).toBe(1);
  expect(metadata.layer?.srs).toEqual(['EPSG:3857']);
  expect(metadata.formatHeader).toMatchObject({
    styleURL: `${VECTOR_TILE_SERVER_URL}/resources/styles/root.json`,
    spriteURL: `${VECTOR_TILE_SERVER_URL}/resources/sprites/sprite`
  });
});

test('ArcGISVectorTileServerSource builds standard resource URLs', () => {
  const source = ArcGISVectorTileServerSourceLoader.createDataSource(VECTOR_TILE_SERVER_URL, {});
  expect(source.getMetadataURL()).toBe(`${VECTOR_TILE_SERVER_URL}?f=pjson`);
  expect(source.getStyleURL()).toBe(`${VECTOR_TILE_SERVER_URL}/resources/styles/root.json`);
  expect(source.getSpriteURL()).toBe(`${VECTOR_TILE_SERVER_URL}/resources/sprites/sprite`);
  expect(source.getTileURL({z: 4, x: 6, y: 7})).toBe(`${VECTOR_TILE_SERVER_URL}/tile/4/7/6.pbf`);
});

test('ArcGISVectorTileServerSource preserves service query parameters', () => {
  const source = ArcGISVectorTileServerSourceLoader.createDataSource(
    `${VECTOR_TILE_SERVER_URL}?token=abc`,
    {}
  );
  expect(source.getMetadataURL()).toBe(`${VECTOR_TILE_SERVER_URL}?token=abc&f=pjson`);
  expect(source.getTileURL({z: 4, x: 6, y: 7})).toBe(
    `${VECTOR_TILE_SERVER_URL}/tile/4/7/6.pbf?token=abc`
  );
});

test('ArcGISVectorTileServerSource fetches raw PBF tiles', async () => {
  const source = ArcGISVectorTileServerSourceLoader.createDataSource(VECTOR_TILE_SERVER_URL, {});
  const tileBytes = new Uint8Array([1, 2, 3, 4]);
  source.fetch = async (url, options) => {
    expect(url).toBe(`${VECTOR_TILE_SERVER_URL}/tile/2/5/4.pbf`);
    expect(new Headers(options?.headers).get('accept')).toContain(
      'application/vnd.mapbox-vector-tile'
    );
    expect(options?.signal).toBeDefined();
    return new Response(tileBytes);
  };
  const result = await source.getTile({z: 2, x: 4, y: 5}, new AbortController().signal);
  expect(new Uint8Array(result!)).toEqual(tileBytes);
});

test('ArcGISVectorTileServerSource decodes deck.gl tile data to WGS84', async () => {
  const parseCalls: Array<{options: any}> = [];
  const decodedTile = {shape: 'geojson-table', type: 'FeatureCollection', features: []};
  const source = ArcGISVectorTileServerSourceLoader.createDataSource(
    VECTOR_TILE_SERVER_URL,
    {'arcgis-vector-tile-server': {mvt: {shape: 'geojson-table'}}},
    {
      parse: async (_data: unknown, _loader: unknown, options: unknown) => {
        parseCalls.push({options});
        return decodedTile;
      }
    } as never
  );
  source.fetch = async () => new Response(new Uint8Array([1, 2, 3]));

  await expect(
    source.getTileData({index: {z: 2, x: 4, y: 5}, signal: new AbortController().signal})
  ).resolves.toBe(decodedTile);
  expect(source.mimeType).toBe('application/vnd.mapbox-vector-tile');
  expect(source.localCoordinates).toBe(false);
  expect(parseCalls[0].options.mvt).toMatchObject({
    shape: 'geojson-table',
    coordinates: 'wgs84',
    tileIndex: {z: 2, x: 4, y: 5}
  });
});
