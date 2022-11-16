// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#duplicate-attribute', (t) => {
  testSax(t, {
    xml: '<span id="hello" id="there"></span>',
    expect: [
      [
        'opentagstart',
        {
          name: 'SPAN',
          attributes: {}
        }
      ],
      ['attribute', {name: 'ID', value: 'hello'}],
      [
        'opentag',
        {
          name: 'SPAN',
          attributes: {ID: 'hello'},
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
