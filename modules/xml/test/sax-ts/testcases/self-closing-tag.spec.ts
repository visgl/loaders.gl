// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#self-closing-tag', () => {
  testSax({
    xml:
      '<root>   ' +
      '<haha /> ' +
      '<haha/>  ' +
      '<monkey> ' +
      '=(|)     ' +
      '</monkey>' +
      '</root>  ',
    expect: [
      ['opentagstart', {name: 'ROOT', attributes: {}}],
      ['opentag', {name: 'ROOT', attributes: {}, isSelfClosing: false}],
      ['opentagstart', {name: 'HAHA', attributes: {}}],
      ['opentag', {name: 'HAHA', attributes: {}, isSelfClosing: true}],
      ['closetag', 'HAHA'],
      ['opentagstart', {name: 'HAHA', attributes: {}}],
      ['opentag', {name: 'HAHA', attributes: {}, isSelfClosing: true}],
      ['closetag', 'HAHA'],
      // ["opentag", {name:"HAHA", attributes:{}}],
      // ["closetag", "HAHA"],
      ['opentagstart', {name: 'MONKEY', attributes: {}}],
      ['opentag', {name: 'MONKEY', attributes: {}, isSelfClosing: false}],
      ['text', '=(|)'],
      ['closetag', 'MONKEY'],
      ['closetag', 'ROOT']
    ],
    saxOptions: {trim: true}
  });
});
