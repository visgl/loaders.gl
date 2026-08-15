import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
// https://github.com/isaacs/sax-js/issues/124
test('SAXParser#stand-alone-comment', () => {
  testSax({
    xml: '<!-- stand alone comment -->',
    expect: [['comment', ' stand alone comment ']],
    saxOptions: {
      strict: true
    }
  });
});
