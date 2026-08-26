import {expect, test} from 'vitest';
import {GeoZarrRasterSource} from '../src/geo-zarr-source-loader';

test('GeoZarrRasterSource exposes scan metadata for variables and slices', async () => {
  const source = new GeoZarrRasterSource('data.zarr', {});
  (source as unknown as {getMetadata: () => Promise<unknown>}).getMetadata = async () => ({
    name: 'temperature',
    array: 'temperature',
    width: 100,
    height: 50,
    bandCount: 1,
    dtype: 'float32',
    boundingBox: [
      [0, 0],
      [10, 5]
    ],
    crs: 'EPSG:4326',
    selectionDimensions: [{name: 'time', size: 4, defaultIndex: 0}]
  });
  const metadata = await source.getQueryMetadata();
  expect(metadata.sourceType).toBe('geozarr');
  expect(metadata.columns.map(column => column.name)).toEqual(['temperature']);
  expect(metadata.capabilities.slices).toBe('pushdown');
  expect(metadata.spatial?.coordinateReferenceSystems).toEqual(['EPSG:4326']);
});

test('GeoZarrRasterSource checks scan metadata cancellation', async () => {
  const source = new GeoZarrRasterSource('data.zarr', {});
  const controller = new AbortController();
  controller.abort();
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow('aborted');
});
