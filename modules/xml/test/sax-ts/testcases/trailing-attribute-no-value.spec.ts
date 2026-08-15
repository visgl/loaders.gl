import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#trailing-attribute-no-value', () => {
  testSax({
    xml: '<root attrib>',
    expect: [
      ['opentagstart', {name: 'ROOT', attributes: {}}],
      ['attribute', {name: 'ATTRIB', value: 'attrib'}],
      ['opentag', {name: 'ROOT', attributes: {ATTRIB: 'attrib'}, isSelfClosing: false}]
    ],
    saxOptions: {trim: true}
  });
});
