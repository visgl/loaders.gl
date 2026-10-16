import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GeoTIFFLoader, GeoTIFFSourceLoader} from '@loaders.gl/raster/geotiff/index';
const TIFF_URL = '@loaders.gl/raster/test/geotiff/data/gfw-azores.tif';
test('GeoTIFFLoader.', async () => {
  const geoimage = await load(TIFF_URL, GeoTIFFLoader);
  expect(geoimage, 'GeoTIFFLoader returned a result').toBeTruthy();
});
test('GeoTIFF raster query capabilities advertise supported cancellation', async () => {
  const source = GeoTIFFSourceLoader.createDataSource('https://example.com/data.tif', {});
  expect(source.getRasterQueryCapabilities().bounds).toBe('pushdown');
  expect(source.getRasterQueryCapabilities().cancellation).toBe(true);
});
