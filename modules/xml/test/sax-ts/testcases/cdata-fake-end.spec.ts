// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#cdata-fake-end', (t) => {
  const p = testSax(t, {
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', '[[[[[[[[]]]]]]]]'],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  });
  let x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>';
  for (let i = 0; i < x.length; i++) {
    p.write(x.charAt(i));
  }
  p.close();

  const p2 = testSax(t, {
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', '[[[[[[[[]]]]]]]]'],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  });
  x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>';
  p2.write(x).close();

  t.end();
});
