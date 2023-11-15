// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#unclosed-root', (t) => {
  testSax(t, {
    xml: '<root>',
    expect: [
      [
        'opentagstart',
        {
          name: 'root',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'root',
          attributes: {},
          isSelfClosing: false
        }
      ],
      ['error', 'Unclosed root tag\nLine: 0\nColumn: 6\nChar: ']
    ],
    saxOptions: {
      strict: true
    }
  });
  t.end();
});
