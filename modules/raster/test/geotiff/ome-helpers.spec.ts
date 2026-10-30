// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';

import {getOmeLegacyIndexer, getOmeSubIFDIndexer} from '../../src/geotiff/lib/ome/ome-indexers';
import {loadOmeTiff} from '../../src/geotiff/lib/ome/load-ome-tiff';
import {getOmePixelSourceMeta} from '../../src/geotiff/lib/ome/ome-utils';
import {getDims, getLabels} from '../../src/geotiff/lib/ome/utils';

const PIXELS = {
  SizeT: 2,
  SizeC: 3,
  SizeZ: 2,
  SizeX: 100,
  SizeY: 80,
  DimensionOrder: 'XYZCT',
  Type: 'uint16'
};

describe('OME-TIFF helpers', () => {
  test('maps dimension orders and rejects duplicate or unknown dimensions', () => {
    expect(getLabels('XYZCT')).toEqual(['t', 'c', 'z', 'y', 'x']);
    const dimensions = getDims(['t', 'c', 'z', 'y', 'x']);
    expect(dimensions('x')).toBe(4);
    expect(() => getDims(['x', 'y', 'x'])).toThrow('duplicated label');
    expect(() => dimensions('missing' as any)).toThrow('Invalid dimension');
  });

  test.each([
    ['XYZCT', 6],
    ['XYZTC', 2],
    ['XYCTZ', 3],
    ['XYCZT', 6],
    ['XYTCZ', 1],
    ['XYTZC', 1]
  ])('indexes %s dimension order', async (dimensionOrder, expectedIndex) => {
    const images = Array.from({length: 12}, (_, index) => ({index}));
    const tiff = {getImage: vi.fn(index => images[index])} as any;
    const rootMetadata = [{Pixels: {...PIXELS, DimensionOrder: dimensionOrder}}] as any;
    const indexer = getOmeLegacyIndexer(tiff, rootMetadata);

    expect(indexer({t: 1, c: 0, z: 0}, 0)).toBe(images[expectedIndex]);
    expect(tiff.getImage).toHaveBeenCalledWith(expectedIndex);
  });

  test('rejects an invalid dimension order', () => {
    const tiff = {getImage: vi.fn()} as any;
    const rootMetadata = [{Pixels: {...PIXELS, DimensionOrder: 'invalid'}}] as any;
    expect(() => getOmeLegacyIndexer(tiff, rootMetadata)).toThrow('Invalid OME-XML DimensionOrder');
  });

  test('uses a base image for the highest-resolution sub-IFD level', async () => {
    const baseImage = {fileDirectory: {}};
    const tiff = {getImage: vi.fn(async () => baseImage)} as any;
    const indexer = getOmeSubIFDIndexer(tiff, [{Pixels: PIXELS}] as any);

    await expect(indexer({t: 0, c: 0, z: 0}, 0)).resolves.toBe(baseImage);
    expect(tiff.getImage).toHaveBeenCalledWith(0);
  });

  test('reports missing sub-IFDs for lower-resolution requests', async () => {
    const tiff = {getImage: vi.fn(async () => ({fileDirectory: {}}))} as any;
    const indexer = getOmeSubIFDIndexer(tiff, [{Pixels: PIXELS}] as any);

    await expect(indexer({t: 0, c: 0, z: 0}, 1)).rejects.toThrow('missing SubIFDs');
  });

  test('derives interleaved and physical pixel-source metadata', () => {
    const metadata = getOmePixelSourceMeta({
      Pixels: {
        ...PIXELS,
        DimensionOrder: 'XYCZT',
        Type: 'float',
        Interleaved: true,
        PhysicalSizeX: 0.5,
        PhysicalSizeY: 1.5,
        PhysicalSizeZ: 2.5,
        PhysicalSizeXUnit: 'µm',
        PhysicalSizeYUnit: 'µm',
        PhysicalSizeZUnit: 'µm'
      }
    } as any);

    expect(metadata.labels).toEqual(['t', 'z', 'c', 'y', 'x', '_c']);
    expect(metadata.getShape(1)).toEqual([2, 2, 3, 40, 50, 3]);
    expect(metadata.dtype).toBe('float32');
    expect(metadata.physicalSizes).toEqual({
      x: {size: 0.5, unit: 'µm'},
      y: {size: 1.5, unit: 'µm'},
      z: {size: 2.5, unit: 'µm'}
    });
  });

  test('rejects unsupported pixel types', () => {
    expect(() => getOmePixelSourceMeta({Pixels: {...PIXELS, Type: 'rgba'}} as any)).toThrow(
      'Pixel type rgba not supported'
    );
  });
});

const OME_XML =
  '<OME><Image ID="image" Name="sample"><Pixels DimensionOrder="XYZCT" Type="uint8" SizeX="1" SizeY="1" SizeZ="1" SizeC="1" SizeT="1"><Channel ID="channel"/></Pixels></Image></OME>';

test.each(['\0', '\0\0'])('OME adapter removes terminal TIFF ASCII padding %j', async padding => {
  const image = {
    fileDirectory: {ImageDescription: OME_XML + padding},
    getTileWidth: () => 1
  } as any;
  const result = await loadOmeTiff({} as any, image);
  expect(result.metadata.Name).toBe('sample');
  expect(result.metadata.Pixels.SizeX).toBe(1);
  expect(result.data[0].dtype).toBe('uint8');
  expect(result.data[0].shape).toEqual([1, 1, 1, 1, 1]);
});

test('OME adapter still rejects NUL characters inside XML content', async () => {
  const image = {
    fileDirectory: {ImageDescription: OME_XML.replace('sample', 'bad\0name')},
    getTileWidth: () => 1
  } as any;
  await expect(loadOmeTiff({} as any, image)).rejects.toThrow('invalid XML character');
});

test('OME adapter rejects a long interior padding run without treating it as a terminator', async () => {
  const image = {
    fileDirectory: {ImageDescription: OME_XML + '\0'.repeat(16384) + 'x'},
    getTileWidth: () => 1
  } as any;
  await expect(loadOmeTiff({} as any, image)).rejects.toThrow('invalid XML character');
});
