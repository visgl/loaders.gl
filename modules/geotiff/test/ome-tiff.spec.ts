import {expect, test} from 'vitest';
import {fromFile} from 'geotiff';
import {resolvePath, isBrowser} from '@loaders.gl/core';
import {loadGeoTiff} from '@loaders.gl/geotiff';
const TIFF_URL = resolvePath('@loaders.gl/geotiff/test/data/multi-channel.ome.tif');
test('Creates correct TiffPixelSource for OME-TIFF.', async () => {
  if (isBrowser) {
    return;
  }
  const tiff = await fromFile(TIFF_URL);
  const {data} = await loadGeoTiff(tiff);
  expect(data.length, 'image should not be pyramidal.').toBe(1);
  const [base] = data;
  expect(base.labels, 'should have DimensionOrder "XYZCT".').toEqual(['t', 'c', 'z', 'y', 'x']);
  expect(base.shape, 'shape should match dimensions.').toEqual([1, 3, 1, 167, 439]);
  expect(base.meta?.photometricInterpretation, 'Photometric interpretation is 1.').toBe(1);
  expect(base.meta?.physicalSizes, 'No physical sizes.').toBe(undefined);
});
test('Get raster data.', async () => {
  if (isBrowser) {
    return;
  }
  const tiff = await fromFile(TIFF_URL);
  const {data} = await loadGeoTiff(tiff);
  const [base] = data;
  for (let c = 0; c < 3; c += 1) {
    const selection = {c, z: 0, t: 0};
    const pixelData = await base.getRaster({selection}); // eslint-disable-line no-await-in-loop
    expect(pixelData.width).toBe(439);
    expect(pixelData.height).toBe(167);
    expect(pixelData.data.length).toBe(439 * 167);
    expect(pixelData.data.constructor.name).toBe('Int8Array');
  }
  try {
    await base.getRaster({selection: {c: 3, z: 0, t: 0}});
  } catch (e) {
    expect(e instanceof Error, 'index should be out of bounds.').toBeTruthy();
  }
});
test('Correct OME-XML.', async () => {
  if (isBrowser) {
    return;
  }
  const tiff = await fromFile(TIFF_URL);
  const {metadata} = await loadGeoTiff(tiff);
  const {Name, Pixels} = metadata;
  // biome-ignore format: preserve intentional fixture layout
  expect(Name, 'Name should be \'multi-channel.ome.tif\'.').toBe('multi-channel.ome.tif');
  // @ts-ignore
  expect(Pixels.SizeC, 'Should have three channels.').toBe(3);
  // @ts-ignore
  expect(Pixels.SizeT, 'Should have one time index.').toBe(1);
  // @ts-ignore
  expect(Pixels.SizeX, 'Should have SizeX of 429.').toBe(439);
  // @ts-ignore
  expect(Pixels.SizeY, 'Should have SizeY of 167.').toBe(167);
  // @ts-ignore
  expect(Pixels.SizeZ, 'Should have one z index.').toBe(1);
  // @ts-ignore
  expect(Pixels.Type, 'Should be int8 pixel type.').toBe('int8');
  // @ts-ignore
  expect(Pixels.Channels.length).toBe(3);
  // @ts-ignore
  expect(Pixels.Channels[0].SamplesPerPixel).toBe(1);
});
