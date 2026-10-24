// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {SnapshotTestRunner} from '@luma.gl/test-utils';
import {TEST_CASES} from './test-cases';

const TOTAL_TIMEOUT = TEST_CASES.reduce(
  (totalTimeout, testCase) => totalTimeout + (testCase.timeout || 2000),
  0
);

test(
  'RenderTest',
  async () => {
    const failures = [];

    await new SnapshotTestRunner({width: 800, height: 450}).add(TEST_CASES).run({
      onTestStart: testCase => console.info(testCase.name),
      onTestFail: (testCase, result) => {
        failures.push(`${testCase.name}: ${result.error || `match: ${result.matchPercentage}`}`);
      },

      imageDiffOptions: {
        threshold: 0.99
        // uncomment to save screenshot to disk
        // saveOnFail: true,
        // uncomment `saveAs` to overwrite current golden images
        // if left commented will be saved as `[name]-fail.png.` enabling comparison
        // saveAs: '[name].png'
      }
    });
    expect(failures).toEqual([]);
  },
  TOTAL_TIMEOUT
);
