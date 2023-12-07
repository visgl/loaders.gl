// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// https://github.com/isaacs/sax-js/issues/35
test('SAXParser#issue-35', (t) => {
  testSax(t, {
    xml: '<xml>&#Xd;&#X0d;\n</xml>',
    expect: [
      ['opentagstart', {name: 'xml', attributes: {}}],
      ['opentag', {name: 'xml', attributes: {}, isSelfClosing: false}],
      ['text', '\r\r\n'],
      ['closetag', 'xml']
    ],
    saxOptions: {
      strict: true
    }
  });

  t.end();
});
