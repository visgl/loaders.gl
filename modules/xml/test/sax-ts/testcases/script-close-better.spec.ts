// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

test('SAXParser#script-close-better', (t) => {
  testSax(t, {
    xml: '<html><head><script>\'<div>foo</div></\'</script></head></html>',
    expect: [
      ['opentagstart', {name: 'HTML', attributes: {}}],
      ['opentag', {name: 'HTML', attributes: {}, isSelfClosing: false}],
      ['opentagstart', {name: 'HEAD', attributes: {}}],
      ['opentag', {name: 'HEAD', attributes: {}, isSelfClosing: false}],
      ['opentagstart', {name: 'SCRIPT', attributes: {}}],
      ['opentag', {name: 'SCRIPT', attributes: {}, isSelfClosing: false}],
      ['script', '\'<div>foo</div></\''],
      ['closetag', 'SCRIPT'],
      ['closetag', 'HEAD'],
      ['closetag', 'HTML']
    ]
  });

  t.end();
});
