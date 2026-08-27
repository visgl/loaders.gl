import {
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  getArcGISServices
} from '@loaders.gl/services';
import {expect, test, vi} from 'vitest';

const IMAGE_SERVER_URL = 'https://example.com/arcgis/rest/services/Imagery/ImageServer';
const MAP_SERVER_URL = 'https://example.com/arcgis/rest/services/Basemap/MapServer';

test('discovers ArcGIS services and nested folders', async () => {
  const fetchFile = vi.fn(async (url: string) => {
    if (url.includes('/Utilities?')) {
      return new Response(
        JSON.stringify({services: [{name: 'Geometry', type: 'GPServer'}], folders: []})
      );
    }
    return new Response(
      JSON.stringify({
        services: [{name: 'Basemap', type: 'MapServer'}],
        folders: ['Utilities']
      })
    );
  });

  const services = await getArcGISServices(
    'https://example.com/arcgis/rest/services/Basemap/MapServer',
    fetchFile
  );

  expect(services).toEqual([
    {
      name: 'Basemap',
      type: 'arcgis-map-server',
      url: 'https://example.com/arcgis/rest/services/Basemap/MapServer'
    },
    {
      name: 'Geometry',
      type: 'arcgis-gp-server',
      url: 'https://example.com/arcgis/rest/services/UtilitiesGeometry/GPServer'
    }
  ]);
  expect(await getArcGISServices('https://example.com/catalog')).toBeNull();
  expect(fetchFile).toHaveBeenCalledTimes(2);
});

test('loads MapServer metadata and decodes cached tiles', async () => {
  const parse = vi.fn(async () => ({shape: 'image'}));
  const source = ArcGISMapTileSourceLoader.createDataSource(
    MAP_SERVER_URL,
    {
      'arcgis-map-server': {
        metadata: {
          name: 'Basemap',
          description: 'A basemap',
          copyrightText: 'Example',
          fullExtent: {xmin: -1, ymin: -2, xmax: 3, ymax: 4, spatialReference: {wkid: 3857}},
          tileInfo: {
            rows: 256,
            cols: 256,
            lods: [{level: 0}, {level: 3}],
            spatialReference: {wkid: 3857}
          }
        }
      }
    },
    {parse} as never
  );
  source.fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));

  await expect(source.getMetadata()).resolves.toMatchObject({
    name: 'Basemap',
    maxZoom: 3,
    attributions: ['Example'],
    layer: {srs: ['EPSG:3857']}
  });
  await expect(source.getTile({x: 0, y: 0, z: 0})).resolves.toEqual({shape: 'image'});
  await expect(source.getTileData({index: {x: 0, y: 0, z: 0}})).resolves.toEqual({shape: 'image'});
  expect(parse).toHaveBeenCalled();
});

test('loads MapServer metadata from the service and supports dynamic exports', async () => {
  const source = ArcGISMapTileSourceLoader.createDataSource(MAP_SERVER_URL, {
    'arcgis-map-server': {mode: 'dynamic', exportParameters: {token: 'abc'}}
  });
  source.fetch = vi.fn(async url => {
    expect(url).toContain('f=pjson');
    return new Response(JSON.stringify({name: 'Dynamic'}));
  });
  const metadata = await source.getMetadata();
  expect(metadata.name).toBe('Dynamic');
  const exportURL = new URL(source.getExportTileURL({x: 1, y: 2, z: 3}));
  expect(exportURL.searchParams.get('token')).toBe('abc');
});

test('loads ImageServer tiles and metadata', async () => {
  const parse = vi.fn(async () => ({shape: 'image'}));
  const source = ArcGISImageTileSourceLoader.createDataSource(
    IMAGE_SERVER_URL,
    {'arcgis-image-server-tiles': {format: 'lerc'}},
    {parse} as never
  );
  source.fetch = vi.fn(async url => {
    if (url.includes('f=pjson')) {
      return new Response(JSON.stringify({name: 'Imagery', serviceDescription: 'Raster'}));
    }
    return new Response(new Uint8Array([4, 5, 6]));
  });

  await expect(source.getMetadata()).resolves.toMatchObject({name: 'Imagery'});
  await expect(source.getTile({x: 1, y: 1, z: 2})).resolves.toEqual({shape: 'image'});
  await expect(source.getTileData({index: {x: 1, y: 1, z: 2}})).resolves.toEqual({
    shape: 'image'
  });
  expect(source.mimeType).toBe('application/octet-stream');
  expect(parse).toHaveBeenCalled();
});

test('exports ImageServer images and analytical rasters', async () => {
  const parse = vi.fn(async (_data, loader) => ({loader}));
  const source = ArcGISImageServerSourceLoader.createDataSource(IMAGE_SERVER_URL, {}, {
    parse
  } as never);
  source.fetch = vi.fn(async () => new Response(new Uint8Array([7, 8])));
  await expect(
    source.exportImage({bbox: [1, 2, 3, 4], width: 32, height: 16})
  ).resolves.toBeDefined();
  await expect(
    source.exportRaster({bbox: [1, 2, 3, 4], width: 32, height: 16})
  ).resolves.toBeDefined();
  expect(parse).toHaveBeenCalledTimes(2);
});
