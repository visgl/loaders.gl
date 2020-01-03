import test from 'tape-promise/tape';

import LoadImageWorker from './load-image.worker';

import {TEST_CASES} from './test-cases';

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

    const {url} = testCase;

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
