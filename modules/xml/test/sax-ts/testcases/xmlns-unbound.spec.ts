// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#}xmlns-unbound', (t) => {
  testSax(t, {
    expect: [
      [
        'opentagstart',
        {
          name: 'root',
          attributes: {},
          ns: {}
        }
      ],
      ['error', 'Unbound namespace prefix: "unbound"\nLine: 0\nColumn: 28\nChar: >'],
      [
        'attribute',
        {
          name: 'unbound:attr',
          value: 'value',
          uri: 'unbound',
          prefix: 'unbound',
          local: 'attr'
        }
      ],
      [
        'opentag',
        {
          name: 'root',
          uri: '',
          prefix: '',
          local: 'root',
          attributes: {
            'unbound:attr': {
              name: 'unbound:attr',
              value: 'value',
              uri: 'unbound',
              prefix: 'unbound',
              local: 'attr'
            }
          },
          ns: {},
          isSelfClosing: true
        }
      ],
      ['closetag', 'root']
    ],

    saxOptions: {
      strict: true,
      xmlns: true
    }
  }).write('<root unbound:attr=\'value\'/>');

  t.end();
});
