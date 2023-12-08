// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';
import {SAXParser} from '@loaders.gl/xml';

let xml = '<r>';
let text = '';
for (const i in SAXParser.ENTITIES) {
  xml += `&${i};`;
  text += SAXParser.ENTITIES[i];
}
xml += '</r>';

test('SAXParser#entity-mega', (t) => {
  testSax(t, {
    xml,
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', text],
      ['closetag', 'R']
    ]
  });

  t.end();
});
