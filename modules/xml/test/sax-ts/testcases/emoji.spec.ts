// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// split high-order numeric attributes into surrogate pairs
test('SAXParser#emoji', (t) => {
  testSax(t, {
    xml: '<a>&#x1f525;</a>',
    expect: [
      ['opentagstart', {name: 'A', attributes: {}}],
      ['opentag', {name: 'A', attributes: {}, isSelfClosing: false}],
      ['text', '\ud83d\udd25'],
      ['closetag', 'A']
    ],
    saxOptions: {
      strict: false
    }
  });

  t.end();
});
