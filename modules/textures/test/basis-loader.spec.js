import test from 'tape-promise/tape';

import {BasisLoader} from '@loaders.gl/textures';
import {load, setLoaderOptions} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/textures/test/data/alpha3.basis';

setLoaderOptions({
  _workerType: 'test',
  CDN: null
});

test('BasisLoader#imports', (t) => {
  t.ok(BasisLoader, 'BasisLoader defined');
  t.end();
});

test('BasisLoader#load(URL, worker: false)', async (t) => {
  const images = await load(TEST_URL, BasisLoader, {worker: false});

  const image = images[0][0];

  t.ok(image, 'image loaded successfully from URL');

  t.equals(image.width, 768, 'image width is correct');
  t.equals(image.height, 512, 'image height is correct');
  t.equals(image.compressed, false, 'image height is correct');

  t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');
  t.equals(image.data.byteLength, 786432, 'image `data.byteLength` is correct');

  t.end();
});

test('BasisLoader#load(URL, worker: true)', async (t) => {
  const images = await load(TEST_URL, BasisLoader, {worker: true});

  const image = images[0][0];

  t.ok(image, 'image loaded successfully from URL');

  t.equals(image.width, 768, 'image width is correct');
  t.equals(image.height, 512, 'image height is correct');
  t.equals(image.compressed, false, 'image height is correct');

  t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');
  t.equals(image.data.byteLength, 786432, 'image `data.byteLength` is correct');

  t.end();
});

// test('BasisLoader#formats', async t => {
//   for (const testCase of TEST_CASES) {
//     await testLoadImage(t, testCase);
//   }
//   t.end();
// });

/*
test('loadImageTexture#worker', t => {
  if (typeof Worker === 'undefined') {
    t.comment('loadImageTexture only works under browser');
    t.end();
    return;
  }

  const worker = new LoadImageWorker();
  let testIndex = 0;

  const runTest = index => {
    const testCase = TEST_CASES[index];
    if (!testCase) {
      t.end();
      return;
    }
    if (testCase.worker === false) {
      // the current loader does not support loading from dataURL in a worker
      runTest(testIndex++);
      return;
    }

    const {title, width, height} = testCase;
    t.comment(title);

    let {url} = testCase;
    url = url.startsWith('data:') ? url : resolvePath(CONTENT_BASE + url);

    worker.onmessage = ({data}) => {
      if (data.error) {
        t.fail(data.error);
      } else {
        t.ok(data.image, 'loadImageTexture loaded data from url');
        t.ok(
          data.image.width === width && data.image.height === height,
          'loaded image has correct content'
        );
      }

      runTest(testIndex++);
    };

    worker.postMessage(url);
  };

  runTest(testIndex++);
});
*/
