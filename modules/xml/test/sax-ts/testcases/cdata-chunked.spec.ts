// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#cdata-chunked', () => {
  testSax({
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', ' this is character data  '],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  })
    .write('<r><![CDATA[ this is ')
    .write('character data  ')
    .write(']]></r>')
    .close();
});
