// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// https://github.com/isaacs/sax-js/issues/124
test('SAXParser#stand-alone-comment', (t) => {
  testSax(t, {
    xml: '<!-- stand alone comment -->',
    expect: [['comment', ' stand alone comment ']],
    saxOptions: {
      strict: true
    }
  });
  t.end();
});
