import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#unquoted', () => {
  testSax({
    xml: '<span class=test hello=world></span>',
    expect: [
      [
        'opentagstart',
        {
          name: 'SPAN',
          attributes: {}
        }
      ],
      [
        'attribute',
        {
          name: 'CLASS',
          value: 'test'
        }
      ],
      [
        'attribute',
        {
          name: 'HELLO',
          value: 'world'
        }
      ],
      [
        'opentag',
        {
          name: 'SPAN',
          attributes: {
            CLASS: 'test',
            HELLO: 'world'
          },
          isSelfClosing: false
        }
      ],
      ['closetag', 'SPAN']
    ],
    saxOptions: {
      strict: false
    }
  });
});
