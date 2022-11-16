// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#cdata-multiple', (t) => {
  testSax(t, {
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', ' this is '],
      ['closecdata', undefined],
      ['opencdata', undefined],
      ['cdata', 'character data  '],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  })
    .write('<r><![CDATA[ this is ]]>')
    .write('<![CDA')
    .write('T')
    .write('A[')
    .write('character data  ')
    .write(']]></r>')
    .close();

  t.end();
});
