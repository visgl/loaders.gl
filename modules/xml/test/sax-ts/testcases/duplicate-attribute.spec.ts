// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#duplicate-attribute', () => {
  testSax({
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
});
