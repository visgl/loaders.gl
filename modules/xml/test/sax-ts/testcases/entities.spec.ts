// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#entities', (t) => {
  testSax(t, {
    xml:
      '<r>&rfloor; ' +
      '&spades; &copy; &rarr; &amp; ' +
      '&lt; < <  <   < &gt; &real; &weierp; &euro;</r>',
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', '⌋ ♠ © → & < < <  <   < > ℜ ℘ €'],
      ['closetag', 'R']
    ]
  });

  t.end();
});
