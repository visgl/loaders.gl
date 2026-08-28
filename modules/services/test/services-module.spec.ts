import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  ArcGISSceneServerSourceLoader,
  ArcGISVectorTileServerSourceLoader,
  ArcGISVectorSource,
  SERVICE_LOADERS,
  discoverArcGISCapabilities,
  getServiceLoader,
  selectArcGISService
} from '../src/index';
import {load} from '@loaders.gl/core';
import {getArcGISServices} from '../src/arcgis/arcgis-server';
import * as bundledServices from '../src/bundled';
import * as unbundledServices from '../src/unbundled';
import {describe, expect, test} from 'vitest';

describe('@loaders.gl/services', () => {
  test('exports the initial ArcGIS source family', () => {
    expect(ArcGISFeatureServerSourceLoader.id).toBe('arcgis-feature-server');
    expect(ArcGISImageServerSourceLoader.id).toBe('arcgis-image-server');
    expect(ArcGISMapTileSourceLoader.id).toBe('arcgis-map-server');
    expect(ArcGISImageTileSourceLoader.id).toBe('arcgis-image-server-tiles');
    expect(ArcGISVectorTileServerSourceLoader.id).toBe('arcgis-vector-tile-server');
    expect(ArcGISSceneServerSourceLoader.id).toBe('arcgis-scene-server');
  });

  test('identifies services-owned loaders', () => {
    expect(ArcGISFeatureServerSourceLoader.module).toBe('services');
    expect(ArcGISImageServerSourceLoader.module).toBe('services');
    expect(ArcGISMapTileSourceLoader.module).toBe('services');
    expect(ArcGISImageTileSourceLoader.module).toBe('services');
    expect(ArcGISVectorTileServerSourceLoader.module).toBe('services');
  });

  test('finds service loaders by id or type', () => {
    expect(getServiceLoader('ArcGIS-Feature-Server')).toBe(ArcGISFeatureServerSourceLoader);
    expect(getServiceLoader('arcgis-vector-tile-server')).toBe(ArcGISVectorTileServerSourceLoader);
    expect(getServiceLoader('arcgis-scene-server')).toBe(ArcGISSceneServerSourceLoader);
    expect(getServiceLoader('unknown-service')).toBeUndefined();
  });

  test('exports one registry for core and deck.gl integration', () => {
    expect(SERVICE_LOADERS).toEqual([
      ArcGISFeatureServerSourceLoader,
      ArcGISImageServerSourceLoader,
      ArcGISImageTileSourceLoader,
      ArcGISMapTileSourceLoader,
      ArcGISVectorTileServerSourceLoader,
      ArcGISSceneServerSourceLoader
    ]);
  });

  test('passes the service registry directly to load', async () => {
    const source = await load(
      'https://example.com/arcgis/rest/services/Roads/FeatureServer/0',
      SERVICE_LOADERS,
      {core: {type: 'arcgis-feature-server'}}
    );

    expect(source).toBeInstanceOf(ArcGISVectorSource);
  });

  test('keeps the package entrypoints wired to the public exports', () => {
    expect(bundledServices.ArcGISFeatureServerSourceLoader).toBe(ArcGISFeatureServerSourceLoader);
    expect(unbundledServices.ArcGISFeatureServerSourceLoader).toBe(ArcGISFeatureServerSourceLoader);
    expect(bundledServices.ArcGISSceneServerSourceLoader).toBe(ArcGISSceneServerSourceLoader);
    expect(unbundledServices.ArcGISSceneServerSourceLoader).toBe(ArcGISSceneServerSourceLoader);
  });

  test('discovers services from ArcGIS server directories', async () => {
    const requests: string[] = [];
    const services = await getArcGISServices(
      'https://example.com/arcgis/rest/services/Roads/FeatureServer',
      async url => {
        requests.push(url);
        return new Response(
          JSON.stringify(
            url.includes('/Public?')
              ? {services: [{name: 'Basemap', type: 'MapServer'}]}
              : {
                  services: [{name: 'Roads', type: 'FeatureServer'}],
                  folders: ['Public']
                }
          )
        );
      }
    );

    expect(services).toEqual([
      {
        name: 'Roads',
        type: 'arcgis-feature-server',
        url: 'https://example.com/arcgis/rest/services/Roads/FeatureServer'
      },
      {
        name: 'Basemap',
        type: 'arcgis-map-server',
        url: 'https://example.com/arcgis/rest/services/Public/Basemap/MapServer'
      }
    ]);
    expect(requests).toHaveLength(2);
    expect(await getArcGISServices('https://example.com/not-an-arcgis-service')).toBeNull();
  });

  test('normalizes SceneServer capability nodes and selects a requested profile', async () => {
    const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services', {
      fetch: async url => {
        const requestURL = new URL(url);
        if (requestURL.pathname.endsWith('/services')) {
          return new Response(
            JSON.stringify({services: [{name: 'City', type: 'SceneServer'}], folders: []})
          );
        }
        return new Response(
          JSON.stringify({
            name: 'City',
            version: '1.8',
            profile: 'meshpyramids',
            layers: [
              {
                id: 0,
                name: 'Buildings',
                layerType: '3DObject',
                spatialReference: {wkid: 4326}
              }
            ],
            spatialReference: {wkid: 4326}
          })
        );
      }
    });

    expect(graph?.nodes[0]).toMatchObject({
      kind: 'scene',
      capabilities: {
        type: 'arcgis-scene-server',
        layers: [
          {
            name: '0',
            title: 'Buildings',
            crs: ['EPSG:4326'],
            url: 'https://example.com/arcgis/rest/services/City/SceneServer/layers/0'
          }
        ]
      },
      metadata: {profile: 'meshpyramids'}
    });
    expect(selectArcGISService(graph!, {kind: 'scene', profile: 'meshpyramids'})).toBe(
      graph?.nodes[0]
    );
  });

  test('resolves qualified service names from ArcGIS folder directories', async () => {
    const services = await getArcGISServices(
      'https://example.com/arcgis/rest/services',
      async url =>
        new Response(
          JSON.stringify(
            url.endsWith('/services?f=pjson')
              ? {folders: ['AGP']}
              : {services: [{name: 'AGP/Census', type: 'MapServer'}]}
          )
        )
    );

    expect(services?.[0].url).toBe('https://example.com/arcgis/rest/services/AGP/Census/MapServer');
  });

  test('normalizes and selects ArcGIS service capabilities', async () => {
    const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services', {
      fetch: async url => {
        if (url.endsWith('/services?f=pjson')) {
          return new Response(JSON.stringify({services: [{name: 'Imagery', type: 'ImageServer'}]}));
        }
        return new Response(
          JSON.stringify({
            supportedImageFormatTypes: 'PNG,JPEG,LERC',
            spatialReference: {wkid: 3857},
            fullExtent: {spatialReference: {latestWkid: 3857}}
          })
        );
      }
    });

    expect(graph?.nodes[0]).toMatchObject({
      kind: 'image',
      capabilities: {
        formats: ['jpeg', 'lerc', 'png'],
        crs: ['EPSG:3857']
      }
    });
    expect(selectArcGISService(graph!, {kind: 'image', format: 'lerc'})?.name).toBe('Imagery');
    expect(selectArcGISService(graph!, {kind: 'vector'})).toBeUndefined();
  });

  test('does not infer unsupported GeoJSON output', async () => {
    const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services', {
      fetch: async url =>
        new Response(
          JSON.stringify(
            url.endsWith('/services?f=pjson')
              ? {services: [{name: 'Legacy', type: 'FeatureServer'}]}
              : {supportedQueryFormats: 'JSON'}
          )
        )
    });

    expect(graph?.nodes[0].capabilities.formats).toEqual(['json']);
    expect(selectArcGISService(graph!, {format: 'geojson'})).toBeUndefined();
  });

  test('normalizes VectorTileServer directory entries', async () => {
    const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services', {
      fetch: async url =>
        new Response(
          JSON.stringify(
            url.endsWith('/services?f=pjson')
              ? {services: [{name: 'Basemap', type: 'VectorTileServer'}]}
              : {tileInfo: {format: 'pbf'}}
          )
        )
    });

    expect(graph?.nodes[0]).toMatchObject({
      kind: 'tile',
      capabilities: {type: 'arcgis-vector-tile-server', formats: ['pbf']}
    });
  });
});
