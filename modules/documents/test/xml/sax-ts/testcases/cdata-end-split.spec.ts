// SPDX-License-Identifier: ISC
import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#cdata-end-split', () => {
  testSax({
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', ' this is '],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  })
    .write('<r><![CDATA[ this is ]')
    .write(']>')
    .write('</r>')
    .close();
});
