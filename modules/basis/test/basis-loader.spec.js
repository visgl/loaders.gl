import test from 'tape-promise/tape';

import {BasisLoader} from '@loaders.gl/basis';

// import {isBrowser, load} from '@loaders.gl/core';
// import {TEST_CASES, DATA_URL} from './lib/test-cases';
// const TEST_URL = '@loaders.gl/images/test/data/img1-preview.png';

test('BasisLoader#imports', t => {
  t.ok(BasisLoader, 'BasisLoader defined');
  t.end();
});

/*
test('BasisLoader#load(URL)', async t => {
  const image = await load(TEST_URL, BasisLoader);
  t.ok(image, 'image loaded successfully from URL');
  t.end();
});

test('BasisLoader#load(data URL)', async t => {
  const image = await load(DATA_URL, BasisLoader);
  t.ok(image, 'image loaded successfully from data URL');

  t.deepEquals(image.width, 2, 'image width is correct');
  t.deepEquals(image.height, 2, 'image height is correct');
  if (!isBrowser) {
    t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');
    t.equals(image.data.byteLength, 16, 'image `data.byteLength` is correct');
  }

  t.end();
});

test('BasisLoader#formats', async t => {
  for (const testCase of TEST_CASES) {
    await testLoadImage(t, testCase);
  }
  t.end();
});

async function testLoadImage(t, testCase) {
  const {title, url, width, height, skip} = testCase;

  // Skip some test cases under Node.js
  if (skip) {
    return;
  }

  const image = await load(url, BasisLoader);
  t.ok(image, `${title} loaded ${url.slice(0, 40)}...`);
  const imageSize = getImageSize(image);
  t.ok(
    imageSize.width === width && imageSize.height === height,
    `${title} image has correct content ${url.slice(0, 30)}`
  );
}

/*
test('loadImage#worker', t => {
  if (typeof Worker === 'undefined') {
    t.comment('loadImage only works under browser');
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
        t.ok(data.image, 'loadImage loaded data from url');
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
