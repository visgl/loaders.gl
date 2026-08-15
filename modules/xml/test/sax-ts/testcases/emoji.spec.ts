import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
// split high-order numeric attributes into surrogate pairs
test('SAXParser#emoji', () => {
  testSax({
    xml: '<a>&#x1f525;</a>',
    expect: [
      ['opentagstart', {name: 'A', attributes: {}}],
      ['opentag', {name: 'A', attributes: {}, isSelfClosing: false}],
      ['text', '\ud83d\udd25'],
      ['closetag', 'A']
    ],
    saxOptions: {
      strict: false
    }
  });
});
