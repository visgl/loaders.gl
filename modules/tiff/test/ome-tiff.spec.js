import test from 'tape-promise/tape';
import {fromFile} from 'geotiff';

import {load} from '../src/tiff/ome-tiff';

test('Creates correct TiffPixelSource for OME-TIFF.', async t => {
  t.plan(5);
  try {
    const tiff = await fromFile('tests/loaders/fixtures/multi-channel.ome.tif');
    const {data} = await load(tiff);
    t.equal(data.length, 1, 'image should not be pyramidal.');
    const [base] = data;
    t.deepEqual(base.labels, ['t', 'c', 'z', 'y', 'x'], 'should have DimensionOrder "XYZCT".');
    t.deepEqual(base.shape, [1, 3, 1, 167, 439], 'shape should match dimensions.');
    t.equal(base.meta?.photometricInterpretation, 1, 'Photometric interpretation is 1.');
    t.equal(base.meta?.physicalSizes, undefined, 'No physical sizes.');
  } catch (e) {
    t.fail(e);
  }
});

test('Get raster data.', async t => {
  t.plan(13);
  try {
    const tiff = await fromFile('tests/loaders/fixtures/multi-channel.ome.tif');
    const {data} = await load(tiff);
    const [base] = data;

    for (let c = 0; c < 3; c += 1) {
      const selection = {c, z: 0, t: 0};
      const pixelData = await base.getRaster({selection}); // eslint-disable-line no-await-in-loop
      t.equal(pixelData.width, 439);
      t.equal(pixelData.height, 167);
      t.equal(pixelData.data.length, 439 * 167);
      t.equal(pixelData.data.constructor.name, 'Int8Array');
    }

    try {
      await base.getRaster({selection: {c: 3, z: 0, t: 0}});
    } catch (e) {
      t.ok(e instanceof Error, 'index should be out of bounds.');
    }
  } catch (e) {
    t.fail(e);
  }
});

test('Correct OME-XML.', async t => {
  t.plan(9);
  try {
    const tiff = await fromFile('tests/loaders/fixtures/multi-channel.ome.tif');
    const {metadata} = await load(tiff);
    const {Name, Pixels} = metadata;
    t.equal(Name, 'multi-channel.ome.tif', `Name should be 'multi-channel.ome.tif'.`);
    t.equal(Pixels.SizeC, 3, 'Should have three channels.');
    t.equal(Pixels.SizeT, 1, 'Should have one time index.');
    t.equal(Pixels.SizeX, 439, 'Should have SizeX of 429.');
    t.equal(Pixels.SizeY, 167, 'Should have SizeY of 167.');
    t.equal(Pixels.SizeZ, 1, 'Should have one z index.');
    t.equal(Pixels.Type, 'int8', 'Should be int8 pixel type.');
    t.equal(Pixels.Channels.length, 3);
    t.equal(Pixels.Channels[0].SamplesPerPixel, 1);
  } catch (e) {
    t.fail(e);
  }
});
