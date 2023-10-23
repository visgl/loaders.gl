// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#xmlns-xml-default-prefix-attribute', (t) => {
  testSax(t, {
    xml: '<root xml:lang=\'en\'/>',
    expect: [
      [
        'opentagstart',
        {
          name: 'root',
          attributes: {},
          ns: {}
        }
      ],
      [
        'attribute',
        {
          name: 'xml:lang',
          local: 'lang',
          prefix: 'xml',
          uri: 'http://www.w3.org/XML/1998/namespace',
          value: 'en'
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
            'xml:lang': {
              name: 'xml:lang',
              local: 'lang',
              prefix: 'xml',
              uri: 'http://www.w3.org/XML/1998/namespace',
              value: 'en'
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
  });

  t.end();
});
