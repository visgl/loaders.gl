import test from 'tape-promise/tape';

import {ImageLoader, isImageTypeSupported, getImageType, getImageData} from '@loaders.gl/images';
import {isBrowser, load} from '@loaders.gl/core';

import {TEST_CASES, IMAGE_URL, IMAGE_DATA_URL} from './lib/test-cases';
import {getImageSize} from '../dist/es5/lib/parsed-image-api/parsed-image-api';

const TYPES = ['auto', 'imagebitmap', 'html', 'ndarray'].filter(isImageTypeSupported);

test('image loaders#imports', t => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.end();
});

test('ImageLoader#load(URL)', async t => {
  for (const type of TYPES) {
    const image = await load(IMAGE_URL, ImageLoader, {image: {type}});
    t.ok(image, `image of type ${type} loaded successfully from data URL`);
  }
  t.end();
});

test('ImageLoader#load(data URL)', async t => {
  for (const type of TYPES) {
    const image = await load(IMAGE_DATA_URL, ImageLoader, {image: {type}});
    t.ok(image, `image of type ${type} loaded successfully from data URL`);

    const imageData = {...getImageSize(image), data: getImageData(image)};
    t.deepEquals(imageData.width, 2, 'image width is correct');
    t.deepEquals(imageData.height, 2, 'image height is correct');
    if (!isBrowser) {
      t.ok(ArrayBuffer.isView(imageData.data), 'image data is `ArrayBuffer`');
      t.equals(imageData.data.byteLength, 16, 'image `data.byteLength` is correct');
    }
  }
  t.end();
});

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
