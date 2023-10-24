// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#not-string', (t) => {
  testSax(t, {
    xml: new Buffer('<x>y</x>'),
    expect: [
      ['opentagstart', {name: 'x', attributes: {}}],
      ['opentag', {name: 'x', attributes: {}, isSelfClosing: false}],
      ['text', 'y'],
      ['closetag', 'x']
    ],
    saxOptions: {
      strict: true
    }
  });

  t.end();
});
