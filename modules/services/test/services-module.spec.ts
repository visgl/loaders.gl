import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  ArcGISVectorTileServerSourceLoader,
  getServiceLoader
} from '../src/index';
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
    expect(getServiceLoader('unknown-service')).toBeUndefined();
  });

  test('keeps the package entrypoints wired to the public exports', () => {
    expect(bundledServices.ArcGISFeatureServerSourceLoader).toBe(ArcGISFeatureServerSourceLoader);
    expect(unbundledServices.ArcGISFeatureServerSourceLoader).toBe(ArcGISFeatureServerSourceLoader);
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
});
