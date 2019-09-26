import {loadImage} from '@loaders.gl/images';
import {resolvePath} from '@loaders.gl/core';

import test from 'tape-promise/tape';

import LoadImageWorker from './load-image.worker';

import {TEST_CASES} from './test-cases';

function testLoadImage({title, url, width, height}) {
  test(title, t => {
    loadImage(url)
      .then(image => {
        t.ok(image, 'loadImage loaded data url');
        t.ok(
          image.naturalWidth === width && image.naturalHeight === height,
          'loaded image has correct content'
        );
      })
      .catch(t.fail)
      .finally(() => t.end());
  });
}

test('loadImage#imports', t => {
  t.ok(loadImage, 'loadImage defined');
  t.end();
});

test('loadImage#formats', t => {
  if (typeof window === 'undefined') {
    t.comment('loadImage only works under browser');
    t.end();
    return;
  }

  TEST_CASES.forEach(testLoadImage);
  t.end();
});

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
