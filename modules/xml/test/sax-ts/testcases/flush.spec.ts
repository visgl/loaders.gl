// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#flush', () => {
  const parser = testSax({
    expect: [
      ['opentagstart', {name: 'T', attributes: {}}],
      ['opentag', {name: 'T', attributes: {}, isSelfClosing: false}],
      ['text', 'flush'],
      ['text', 'rest'],
      ['closetag', 'T']
    ]
  });
  parser.write('<T>flush');
  parser.flush();
  parser.write('rest</T>');
  parser.close();
});
