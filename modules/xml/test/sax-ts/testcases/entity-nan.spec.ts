// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#entity-nan', (t) => {
  testSax(t, {
    xml: '<r>&#NaN;</r>',
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', '&#NaN;'],
      ['closetag', 'R']
    ]
  });

  t.end();
});
