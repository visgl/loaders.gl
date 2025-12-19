// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

// unquoted attributes should be ok in non-strict mode
// https://github.com/isaacs/sax-js/issues/31
import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#unquoted', (t) => {
  testSax(t, {
    xml: '<span class=test hello=world></span>',
    expect: [
      [
        'opentagstart',
        {
          name: 'SPAN',
          attributes: {}
        }
      ],
      [
        'attribute',
        {
          name: 'CLASS',
          value: 'test'
        }
      ],
      [
        'attribute',
        {
          name: 'HELLO',
          value: 'world'
        }
      ],
      [
        'opentag',
        {
          name: 'SPAN',
          attributes: {
            CLASS: 'test',
            HELLO: 'world'
          },
          isSelfClosing: false
        }
      ],
      ['closetag', 'SPAN']
    ],
    saxOptions: {
      strict: false
    }
  });
  t.end();
});
