// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#cdata-chunked', (t) => {
  testSax(t, {
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', ' this is character data  '],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  })
    .write('<r><![CDATA[ this is ')
    .write('character data  ')
    .write(']]></r>')
    .close();

  t.end();
});
