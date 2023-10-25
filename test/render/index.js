// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape';
import {SnapshotTestRunner} from '@luma.gl/test-utils';
import {TEST_CASES} from './test-cases';

const TOTAL_TIMEOUT = TEST_CASES.reduce((t, testCase) => t + (testCase.timeout || 2000), 0);

test('RenderTest', t => {
  t.timeoutAfter(TOTAL_TIMEOUT);

  new SnapshotTestRunner({width: 800, height: 450})
    .add(TEST_CASES)
    .run({
      onTestStart: testCase => t.comment(testCase.name),
      onTestPass: (testCase, result) => t.pass(`match: ${result.matchPercentage}`),
      onTestFail: (testCase, result) => t.fail(result.error || `match: ${result.matchPercentage}`),

      imageDiffOptions: {
        threshold: 0.99
        // uncomment to save screenshot to disk
        // saveOnFail: true,
        // uncomment `saveAs` to overwrite current golden images
        // if left commented will be saved as `[name]-fail.png.` enabling comparison
        // saveAs: '[name].png'
      }
    })
    .catch(t.fail)
    .finally(t.end);
});
