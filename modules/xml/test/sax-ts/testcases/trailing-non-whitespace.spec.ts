// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#trailing-non-whitespace', (t) => {
  testSax(t, {
    xml: '<span>Welcome,</span> to monkey land',
    expect: [
      [
        'opentagstart',
        {
          name: 'SPAN',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'SPAN',
          attributes: {},
          isSelfClosing: false
        }
      ],
      ['text', 'Welcome,'],
      ['closetag', 'SPAN'],
      ['text', ' to monkey land'],
      ['end'],
      ['ready']
    ],
    saxOptions: {
      strict: false
    }
  });
  t.end();
});
