import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader,
  ArcGISVectorTileServerSourceLoader,
  getServiceLoader
} from '../src/index';
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

  test('finds service loaders by id or type', () => {
    expect(getServiceLoader('ArcGIS-Feature-Server')).toBe(ArcGISFeatureServerSourceLoader);
    expect(getServiceLoader('arcgis-vector-tile-server')).toBe(ArcGISVectorTileServerSourceLoader);
    expect(getServiceLoader('unknown-service')).toBeUndefined();
  });

  test('keeps the package entrypoints wired to the public exports', () => {
    expect(bundledServices.ArcGISFeatureServerSourceLoader).toBe(ArcGISFeatureServerSourceLoader);
    expect(unbundledServices.ArcGISFeatureServerSourceLoader).toBe(ArcGISFeatureServerSourceLoader);
  });
});
