// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#xmlns-as-tag-name', (t) => {
  testSax(t, {
    xml: '<xmlns/>',
    expect: [
      [
        'opentagstart',
        {
          name: 'xmlns',
          attributes: {},
          ns: {}
        }
      ],
      [
        'opentag',
        {
          name: 'xmlns',
          uri: '',
          prefix: '',
          local: 'xmlns',
          attributes: {},
          ns: {},
          isSelfClosing: true
        }
      ],
      ['closetag', 'xmlns']
    ],
    saxOptions: {
      strict: true,
      xmlns: true
    }
  });

  t.end();
});
