// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#cyrillic', (t) => {
  testSax(t, {
    xml: '<Р>тест</Р>',
    expect: [
      ['opentagstart', {name: 'Р', attributes: {}}],
      ['opentag', {name: 'Р', attributes: {}, isSelfClosing: false}],
      ['text', 'тест'],
      ['closetag', 'Р']
    ]
  });

  t.end();
});
