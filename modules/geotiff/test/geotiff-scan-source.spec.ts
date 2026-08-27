import {expect, test} from 'vitest';
import {GeoTIFFRasterSource} from '../src/geotiff-source-loader';

test('GeoTIFFRasterSource exposes normalized scan metadata', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  (source as unknown as {getMetadata: () => Promise<unknown>}).getMetadata = async () => ({
    name: 'elevation.tif',
    width: 1024,
    height: 512,
    bandCount: 2,
    dtype: 'float32',
    noData: -9999,
    crs: 'EPSG:32633',
    boundingBox: [
      [-10, 20],
      [30, 60]
    ],
    overviews: [
      {index: 0, width: 1024, height: 512, resolution: [1, 1]},
      {index: 1, width: 512, height: 256, resolution: [2, 2]}
    ]
  });

  const metadata = await source.getQueryMetadata();
  expect(metadata.sourceType).toBe('geotiff');
  expect(metadata.queryType).toBe('raster');
  expect(metadata.execution).toEqual({status: 'supported', method: 'getRaster'});
  expect(metadata.columns.map(column => column.name)).toEqual(['band_1', 'band_2']);
  expect(metadata.columns[0]?.type).toBe('float32');
  expect(metadata.spatial?.bounds).toEqual({minimum: [-10, 20], maximum: [30, 60]});
  expect(metadata.spatial?.coordinateReferenceSystems).toEqual(['EPSG:32633']);
  expect(metadata.levels?.map(level => level.width)).toEqual([1024, 512]);
  expect(metadata.capabilities.levelOfDetail).toBe('pushdown');
});

test('GeoTIFFRasterSource checks scan metadata cancellation', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const controller = new AbortController();
  controller.abort();
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow('aborted');
});
