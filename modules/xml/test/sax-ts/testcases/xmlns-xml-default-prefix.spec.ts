// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#xmlns-xml-default-prefix', (t) => {
  testSax(t, {
    xml: '<xml:root/>',
    expect: [
      [
        'opentagstart',
        {
          name: 'xml:root',
          attributes: {},
          ns: {}
        }
      ],
      [
        'opentag',
        {
          name: 'xml:root',
          uri: 'http://www.w3.org/XML/1998/namespace',
          prefix: 'xml',
          local: 'root',
          attributes: {},
          ns: {},
          isSelfClosing: true
        }
      ],
      ['closetag', 'xml:root']
    ],
    saxOptions: {
      strict: true,
      xmlns: true
    }
  });

  t.end();
});
