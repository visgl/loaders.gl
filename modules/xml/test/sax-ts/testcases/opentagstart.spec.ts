// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#opentagstart', (t) => {
  testSax(t, {
    xml: '<root length=\'12345\'></root>',
    expect: [
      [
        'opentagstart',
        {
          name: 'root',
          ns: {},
          attributes: {}
        }
      ],
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

  testSax(t, {
    xml: '<root length=\'12345\'></root>',
    expect: [
      [
        'opentagstart',
        {
          name: 'root',
          attributes: {}
        }
      ],
      [
        'attribute',
        {
          name: 'length',
          value: '12345'
        }
      ],
      [
        'opentag',
        {
          name: 'root',
          attributes: {
            length: '12345'
          },
          isSelfClosing: false
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: true
    }
  });

  t.end();
});
