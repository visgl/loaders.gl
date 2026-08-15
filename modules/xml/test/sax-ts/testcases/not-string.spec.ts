import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#not-string', () => {
  testSax({
    xml: {toString: () => '<x>y</x>'},
    expect: [
      ['opentagstart', {name: 'x', attributes: {}}],
      ['opentag', {name: 'x', attributes: {}, isSelfClosing: false}],
      ['text', 'y'],
      ['closetag', 'x']
    ],
    saxOptions: {
      strict: true
    }
  });
});
