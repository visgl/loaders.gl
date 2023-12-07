// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#flush', (t) => {
  const parser = testSax(t, {
    expect: [
      ['opentagstart', {name: 'T', attributes: {}}],
      ['opentag', {name: 'T', attributes: {}, isSelfClosing: false}],
      ['text', 'flush'],
      ['text', 'rest'],
      ['closetag', 'T']
    ]
  });

  parser.write('<T>flush');
  parser.flush();
  parser.write('rest</T>');
  parser.close();

  t.end();
});
