import {test} from 'tape-promise/tape';
import {loadZarr} from '@loaders.gl/zarr';
import {resolvePath, isBrowser} from '@loaders.gl/core';

const CONTENT_BASE = resolvePath('@loaders.gl/zarr/test/data');
const OME_FIXTURE = `${CONTENT_BASE}/ome.zarr`;
const FIXTURE = `${CONTENT_BASE}/multiscale.zarr`;
const LABELS = ['foo', 'bar', 'baz', 'y', 'x'];

// TODO: Fix browser tests!
// Requests for fixtures in the browser return a 404, so these tests fail.
// ref: https://github.com/visgl/loaders.gl/pull/1462#discussion_r653063007

test('Creates correct ZarrPixelSource.', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  t.plan(3);
  try {
    const {data} = await loadZarr(FIXTURE, {labels: LABELS});
    t.equal(data.length, 2, 'Image should have two levels.');
    const [base] = data;
    t.deepEqual(base.labels, ['foo', 'bar', 'baz', 'y', 'x']);
    t.deepEqual(base.shape, [1, 3, 1, 167, 439], 'shape should match dimensions.');
  } catch (e) {
    t.fail(e);
  }
});

test('Creates correct OME ZarrPixelSource.', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  t.plan(3);
  try {
    const {data} = await loadZarr(OME_FIXTURE);
    t.equal(data.length, 2, 'Image should have two levels.');
    const [base] = data;
    t.deepEqual(base.labels, ['t', 'c', 'z', 'y', 'x'], 'should have DimensionOrder "XYZCT".');
    t.deepEqual(base.shape, [1, 3, 1, 167, 439], 'shape should match dimensions.');
  } catch (e) {
    t.fail(e);
  }
});

test('Get raster data.', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  t.plan(13);
  try {
    const {data} = await loadZarr(FIXTURE, {labels: LABELS});
    const [base] = data;

    for (let i = 0; i < 3; i += 1) {
      const selection = {bar: i, foo: 0, baz: 0};
      const pixelData = await base.getRaster({selection});
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

test('Invalid labels.', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  t.plan(3);
  try {
    await loadZarr(FIXTURE, {labels: ['a', 'b', 'y', 'x']});
  } catch (e) {
    t.ok(e instanceof Error, 'labels should correspond to array shape.');
  }
  try {
    await loadZarr(FIXTURE, {labels: ['a', 'b', 'c', 'y', 'w']});
  } catch (e) {
    t.ok(e instanceof Error, 'labels should end with y and x.');
  }
  try {
    await loadZarr(FIXTURE, {labels: ['a', 'b', 'y', 'x', '_c']});
  } catch (e) {
    t.ok(e instanceof Error, 'labels should end with y and x.');
  }
});
