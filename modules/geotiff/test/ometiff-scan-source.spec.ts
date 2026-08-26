import {expect, test} from 'vitest';
import {OMETiffImageSource} from '../src/ometiff-source-loader';

test('OMETiffImageSource exposes channel and pyramid scan metadata', async () => {
  const source = new OMETiffImageSource(new Blob([]), {});
  (source as unknown as {getMetadata: () => Promise<unknown>}).getMetadata = async () => ({
    name: 'sample.ome.tiff',
    width: 100,
    height: 50,
    bandCount: 2,
    dtype: 'uint16',
    sizeT: 3,
    sizeZ: 1,
    sizeC: 2,
    labels: ['t', 'y', 'x', '_c'],
    channels: [
      {index: 0, name: 'DAPI'},
      {index: 1, name: 'GFP'}
    ],
    levels: [
      {level: 0, width: 100, height: 50},
      {level: 1, width: 50, height: 25}
    ],
    metadata: {}
  });
  const metadata = await source.getQueryMetadata();
  expect(metadata.sourceType).toBe('ometiff');
  expect(metadata.columns.map(column => column.name)).toEqual(['DAPI', 'GFP']);
  expect(metadata.capabilities.levelOfDetail).toBe('pushdown');
  expect(metadata.levels?.map(level => level.scale)).toEqual([
    [1, 1],
    [2, 2]
  ]);
});
