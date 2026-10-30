// SPDX-License-Identifier: ISC
import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#unclosed-root', () => {
  testSax({
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
});
