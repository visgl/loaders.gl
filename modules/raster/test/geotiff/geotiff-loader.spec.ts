import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GeoTIFFLoader} from '@loaders.gl/raster/geotiff/index';
import {GeoTIFFLoaderWithParser} from '@loaders.gl/raster/geotiff-loader';
const TIFF_URL = '@loaders.gl/raster/test/geotiff/data/gfw-azores.tif';
test('GeoTIFFLoader.', async () => {
  const geoimage = await load(TIFF_URL, GeoTIFFLoader);
  expect(geoimage, 'GeoTIFFLoader returned a result').toBeTruthy();
});
test('GeoTIFF raster query capabilities advertise supported cancellation', async () => {
  const source = GeoTIFFLoaderWithParser.createDataSourceSync('https://example.com/data.tif', {});
  expect(source.getRasterQueryCapabilities().bounds).toBe('pushdown');
  expect(source.getRasterQueryCapabilities().cancellation).toBe(true);
});

test.each([
  ['raster.GEOTIFF?download=1', true],
  ['raster.tif#image', true],
  ['raster.ome.tiff?download=1', false],
  ['raster.parquet', false]
])('GeoTIFFLoader source selection for %s', (url, matches) => {
  expect(GeoTIFFLoader.testURL(url)).toBe(matches);
});
