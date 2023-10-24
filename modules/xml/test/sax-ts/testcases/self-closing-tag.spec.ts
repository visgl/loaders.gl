// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#self-closing-tag', (t) => {
  testSax(t, {
    xml:
      '<root>   ' +
      '<haha /> ' +
      '<haha/>  ' +
      '<monkey> ' +
      '=(|)     ' +
      '</monkey>' +
      '</root>  ',
    expect: [
      ['opentagstart', {name: 'ROOT', attributes: {}}],
      ['opentag', {name: 'ROOT', attributes: {}, isSelfClosing: false}],
      ['opentagstart', {name: 'HAHA', attributes: {}}],
      ['opentag', {name: 'HAHA', attributes: {}, isSelfClosing: true}],
      ['closetag', 'HAHA'],
      ['opentagstart', {name: 'HAHA', attributes: {}}],
      ['opentag', {name: 'HAHA', attributes: {}, isSelfClosing: true}],
      ['closetag', 'HAHA'],
      // ["opentag", {name:"HAHA", attributes:{}}],
      // ["closetag", "HAHA"],
      ['opentagstart', {name: 'MONKEY', attributes: {}}],
      ['opentag', {name: 'MONKEY', attributes: {}, isSelfClosing: false}],
      ['text', '=(|)'],
      ['closetag', 'MONKEY'],
      ['closetag', 'ROOT']
    ],
    saxOptions: {trim: true}
  });
  t.end();
});
