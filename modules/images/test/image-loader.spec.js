import test from 'tape-promise/tape';

import {ImageLoader, ImageBitmapLoader, HTMLImageLoader, _getImageSize} from '@loaders.gl/images';
import {isBrowser, load} from '@loaders.gl/core';

import {TEST_CASES, DATA_URL} from './lib/test-cases';

const TEST_URL = '@loaders.gl/images/test/data/img1-preview.png';

test('image loaders#imports', t => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.ok(ImageBitmapLoader, 'ImageBitmapLoader defined');
  t.ok(HTMLImageLoader, 'HTMLImageLoader defined');
  t.end();
});

test('ImageLoader#load(URL)', async t => {
  const image = await load(TEST_URL, ImageLoader);
  t.ok(image, 'image loaded successfully from URL');
  t.end();
});

test('ImageLoader#load(data URL)', async t => {
  const image = await load(DATA_URL, ImageLoader);
  t.ok(image, 'image loaded successfully from data URL');

  t.deepEquals(image.width, 2, 'image width is correct');
  t.deepEquals(image.height, 2, 'image height is correct');
  if (!isBrowser) {
    t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');
    t.equals(image.data.byteLength, 16, 'image `data.byteLength` is correct');
  }

  t.end();
});

test('ImageLoader#formats', t => {
  TEST_CASES.forEach(testLoadImage);
  t.end();
});

function testLoadImage(testCase) {
  const {title, url, width, height} = testCase;
  test(title, async t => {
    const image = load(url, ImageLoader);
    t.ok(image, `ImageLoader loaded ${url.slice(0, 40)}...`);
    const imageSize = _getImageSize(image);
    t.ok(
      imageSize.width === width && imageSize.height === height,
      `loaded image has correct content ${url.slice(0, 30)}`
    );
    t.end();
  });
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
