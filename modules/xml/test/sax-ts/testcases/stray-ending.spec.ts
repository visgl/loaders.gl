// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// stray ending tags should just be ignored in non-strict mode.
// https://github.com/isaacs/sax-js/issues/32
test('SAXParser#stray-ending', (t) => {
  testSax(t, {
    xml: '<a><b></c></b></a>',
    expect: [
      [
        'opentagstart',
        {
          name: 'A',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'A',
          attributes: {},
          isSelfClosing: false
        }
      ],
      [
        'opentagstart',
        {
          name: 'B',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'B',
          attributes: {},
          isSelfClosing: false
        }
      ],
      ['text', '</c>'],
      ['closetag', 'B'],
      ['closetag', 'A']
    ],
    saxOptions: {
      strict: false
    }
  });
  t.end();
});
