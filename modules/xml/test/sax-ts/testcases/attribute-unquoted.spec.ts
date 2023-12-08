// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#attribute-unquoted', (t) => {
  testSax(t, {
    expect: [
      ['opentagstart', {name: 'ROOT', attributes: {}, ns: {}}],
      [
        'attribute',
        {
          name: 'LENGTH',
          value: '12345',
          prefix: '',
          local: 'LENGTH',
          uri: ''
        }
      ],
      [
        'opentag',
        {
          name: 'ROOT',
          attributes: {
            LENGTH: {
              name: 'LENGTH',
              value: '12345',
              prefix: '',
              local: 'LENGTH',
              uri: ''
            }
          },
          ns: {},
          prefix: '',
          local: 'ROOT',
          uri: '',
          isSelfClosing: false
        }
      ],
      ['closetag', 'ROOT'],
      ['end'],
      ['ready']
    ],
    saxOptions: {
      strict: false,
      xmlns: true
    }
  })
    .write('<root length=12')
    .write('345></root>')
    .close();

  t.end();
});
