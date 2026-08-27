import {
  ArcGISFeatureServerSourceLoader,
  ArcGISImageServerSourceLoader,
  ArcGISImageTileSourceLoader,
  ArcGISMapTileSourceLoader
} from '@loaders.gl/arcgis';
import {describe, expect, test} from 'vitest';

describe('@loaders.gl/arcgis', () => {
  test('exports the initial ArcGIS source family', () => {
    expect(ArcGISFeatureServerSourceLoader.id).toBe('arcgis-feature-server');
    expect(ArcGISImageServerSourceLoader.id).toBe('arcgis-image-server');
    expect(ArcGISMapTileSourceLoader.id).toBe('arcgis-map-server');
    expect(ArcGISImageTileSourceLoader.id).toBe('arcgis-image-server-tiles');
  });
});
