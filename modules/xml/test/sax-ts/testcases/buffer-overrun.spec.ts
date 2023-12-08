// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#buffer-overrun', (t) => {
  testSax(t, {
    saxOptions: {
      MAX_BUFFER_LENGTH: 5
    },
    expect: [
      ['error', 'Max buffer length exceeded: tagName\nLine: 0\nColumn: 15\nChar: '],
      ['error', 'Max buffer length exceeded: tagName\nLine: 0\nColumn: 30\nChar: '],
      ['error', 'Max buffer length exceeded: tagName\nLine: 0\nColumn: 45\nChar: '],
      [
        'opentagstart',
        {
          name: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ',
          attributes: {},
          isSelfClosing: false
        }
      ],
      ['text', 'yo'],
      ['closetag', 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ']
    ]
  })
    .write('<abcdefghijklmn')
    .write('opqrstuvwxyzABC')
    .write('DEFGHIJKLMNOPQR')
    .write('STUVWXYZ>')
    .write('yo')
    .write('</abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ>')
    .close();

  t.end();
});
