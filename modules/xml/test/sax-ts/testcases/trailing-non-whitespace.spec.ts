import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#trailing-non-whitespace', () => {
  testSax({
    xml: '<span>Welcome,</span> to monkey land',
    expect: [
      [
        'opentagstart',
        {
          name: 'SPAN',
          attributes: {}
        }
      ],
      [
        'opentag',
        {
          name: 'SPAN',
          attributes: {},
          isSelfClosing: false
        }
      ],
      ['text', 'Welcome,'],
      ['closetag', 'SPAN'],
      ['text', ' to monkey land'],
      ['end'],
      ['ready']
    ],
    saxOptions: {
      strict: false
    }
  });
});
