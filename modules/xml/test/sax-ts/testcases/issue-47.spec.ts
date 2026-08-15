import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
// https://github.com/isaacs/sax-js/issues/47
test('SAXParser#issue-47', () => {
  testSax({
    xml: '<a href="query.svc?x=1&y=2&z=3"/>',
    expect: [
      ['opentagstart', {name: 'A', attributes: {}}],
      ['attribute', {name: 'HREF', value: 'query.svc?x=1&y=2&z=3'}],
      [
        'opentag',
        {
          name: 'A',
          attributes: {HREF: 'query.svc?x=1&y=2&z=3'},
          isSelfClosing: true
        }
      ],
      ['closetag', 'A']
    ],
    saxOptions: {}
  });
});
