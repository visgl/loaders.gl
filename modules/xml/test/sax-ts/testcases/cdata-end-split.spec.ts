// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#cdata-end-split', (t) => {
  testSax(t, {
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', ' this is '],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  })
    .write('<r><![CDATA[ this is ]')
    .write(']>')
    .write('</r>')
    .close();

  t.end();
});
