// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#attribute-name', (t) => {
  testSax(t, {
    xml: '<root length=\'12345\'></root>',
    expect: [
      ['opentagstart', {name: 'root', attributes: {}, ns: {}}],
      [
        'attribute',
        {
          name: 'length',
          value: '12345',
          prefix: '',
          local: 'length',
          uri: ''
        }
      ],
      [
        'opentag',
        {
          name: 'root',
          prefix: '',
          local: 'root',
          uri: '',
          attributes: {
            length: {
              name: 'length',
              value: '12345',
              prefix: '',
              local: 'length',
              uri: ''
            }
          },
          ns: {},
          isSelfClosing: false
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: true,
      xmlns: true
    }
  });
  t.end();
});
