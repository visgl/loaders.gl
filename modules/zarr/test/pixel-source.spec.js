import {test} from 'tape-promise/tape';

import {load} from '@loaders.gl/zarr';

const FIXTURE = '@loaders.gl/zarr/test/data/bioformats-zarr/data.zarr/0';
const LABELS = ['t', 'c', 'z', 'y', 'x'];

test('Creates correct ZarrPixelSource.', async t => {
  t.plan(3);
  try {
    const data = await load(FIXTURE, LABELS);
    t.equal(data.length, 2, 'Image should have two levels.');
    const [base] = data;
    t.deepEqual(base.labels, ['t', 'c', 'z', 'y', 'x'], 'should have DimensionOrder "XYZCT".');
    t.deepEqual(base.shape, [1, 3, 1, 167, 439], 'shape should match dimensions.');
  } catch (e) {
    t.fail(e);
  }
});

test('Get raster data.', async t => {
  t.plan(13);
  try {
    const data = await load(FIXTURE, LABELS);
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
