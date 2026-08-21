// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#entity-nan', () => {
  testSax({
    xml: '<r>&#NaN;</r>',
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', '&#NaN;'],
      ['closetag', 'R']
    ]
  });
});
