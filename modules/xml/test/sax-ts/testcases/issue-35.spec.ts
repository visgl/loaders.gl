import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
// https://github.com/isaacs/sax-js/issues/35
test('SAXParser#issue-35', () => {
  testSax({
    xml: '<xml>&#Xd;&#X0d;\n</xml>',
    expect: [
      ['opentagstart', {name: 'xml', attributes: {}}],
      ['opentag', {name: 'xml', attributes: {}, isSelfClosing: false}],
      ['text', '\r\r\n'],
      ['closetag', 'xml']
    ],
    saxOptions: {
      strict: true
    }
  });
});
