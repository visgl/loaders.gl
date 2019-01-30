// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
import test from 'tape';

import TestRender from './test-utils/test-render';
import {TEST_CASES} from './test-cases';

test('RenderTest', t => {
  t.timeoutAfter(TEST_CASES.length * 2000);

  new TestRender({
    width: 800,
    height: 450,
    onTestStart: testCase => t.comment(testCase.name),
    onTestResult: (testCase, result) => {
      if (result.error) {
        t.fail(result.error);
      } else {
        t.ok(result.success, `match: ${result.matchPercentage}`);
      }
    }
  })
    .add(TEST_CASES)
    .run()
    .catch(t.fail)
    .finally(t.end);
});
