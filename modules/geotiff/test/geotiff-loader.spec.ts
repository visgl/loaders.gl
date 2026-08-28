import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GeoTIFFLoader, GeoTIFFSourceLoader} from '@loaders.gl/geotiff';
const TIFF_URL = '@loaders.gl/geotiff/test/data/gfw-azores.tif';
test('GeoTIFFLoader.', async () => {
  const geoimage = await load(TIFF_URL, GeoTIFFLoader);
  expect(geoimage, 'GeoTIFFLoader returned a result').toBeTruthy();
});
test('GeoTIFF raster query capabilities report cancellation conservatively', async () => {
  const source = GeoTIFFSourceLoader.createDataSource('https://example.com/data.tif', {});
  expect(source.getRasterQueryCapabilities().bounds).toBe('pushdown');
  expect(source.getRasterQueryCapabilities().cancellation).toBeFalsy();
});
