// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#issue-86', (t) => {
  testSax(t, {
    xml: '<root>abc</root>de<f',
    expect: [
      [
        'opentagstart',
        {
          name: 'ROOT',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'ROOT',
          attributes: {},
          isSelfClosing: false
        }
      ],
      ['text', 'abc'],
      ['closetag', 'ROOT'],
      ['text', 'de<f']
    ],
    saxOptions: {
      strict: false
    }
  });

  testSax(t, {
    xml: '<root>abc</root>de<f',
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
      ['text', 'abc'],
      ['closetag', 'root'],
      ['error', 'Text data outside of root node.\nLine: 0\nColumn: 17\nChar: d'],
      ['text', 'd'],
      ['error', 'Text data outside of root node.\nLine: 0\nColumn: 18\nChar: e'],
      ['text', 'e'],
      ['error', 'Unexpected end\nLine: 0\nColumn: 20\nChar: ']
    ],
    saxOptions: {
      strict: true
    }
  });

  t.end();
});
