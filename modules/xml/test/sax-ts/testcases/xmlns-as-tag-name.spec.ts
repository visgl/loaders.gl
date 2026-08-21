// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#xmlns-as-tag-name', () => {
  testSax({
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
});
