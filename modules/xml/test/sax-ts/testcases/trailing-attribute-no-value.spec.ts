// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#trailing-attribute-no-value', (t) => {
  testSax(t, {
    xml: '<root attrib>',
    expect: [
      ['opentagstart', {name: 'ROOT', attributes: {}}],
      ['attribute', {name: 'ATTRIB', value: 'attrib'}],
      ['opentag', {name: 'ROOT', attributes: {ATTRIB: 'attrib'}, isSelfClosing: false}]
    ],
    saxOptions: {trim: true}
  });
  t.end();
});
