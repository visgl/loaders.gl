// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// https://github.com/isaacs/sax-js/issues/49
test('SAXParser#issue-84', (t) => {
  testSax(t, {
    xml: '<?has unbalanced "quotes?><xml>body</xml>',
    expect: [
      ['processinginstruction', {name: 'has', body: 'unbalanced "quotes'}],
      ['opentagstart', {name: 'xml', attributes: {}}],
      ['opentag', {name: 'xml', attributes: {}, isSelfClosing: false}],
      ['text', 'body'],
      ['closetag', 'xml']
    ],
    saxOptions: {
      strict: false,
      lowercasetags: true,
      noscript: true
    }
  });

  t.end();
});
