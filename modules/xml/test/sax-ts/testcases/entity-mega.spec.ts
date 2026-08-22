// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
import {SAXParser} from '@loaders.gl/xml';
let xml = '<r>';
let text = '';
for (const i in SAXParser.ENTITIES) {
  xml += `&${i};`;
  text += SAXParser.ENTITIES[i];
}
xml += '</r>';
test('SAXParser#entity-mega', () => {
  testSax({
    xml,
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', text],
      ['closetag', 'R']
    ]
  });
});
