// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#cyrillic', () => {
  testSax({
    xml: '<Р>тест</Р>',
    expect: [
      ['opentagstart', {name: 'Р', attributes: {}}],
      ['opentag', {name: 'Р', attributes: {}, isSelfClosing: false}],
      ['text', 'тест'],
      ['closetag', 'Р']
    ]
  });
});
