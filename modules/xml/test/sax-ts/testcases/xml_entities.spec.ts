// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#xml-entities', (t) => {
  testSax(t, {
    saxOptions: {strictEntities: true},
    xml:
      '<r>&rfloor; ' +
      '&spades; &copy; &rarr; &amp; ' +
      '&lt; < <  <   < &gt; &real; &weierp; &euro;</r>',
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', '&rfloor; &spades; &copy; &rarr; & < < <  <   < > &real; &weierp; &euro;'],
      ['closetag', 'R']
    ]
  });
  t.end();
});
