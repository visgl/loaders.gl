// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// https://github.com/isaacs/sax-js/issues/49
test('SAXParser#issue-49', (t) => {
  testSax(t, {
    xml: '<xml><script>hello world</script></xml>',
    expect: [
      ['opentagstart', {name: 'xml', attributes: {}}],
      ['opentag', {name: 'xml', attributes: {}, isSelfClosing: false}],
      ['opentagstart', {name: 'script', attributes: {}}],
      ['opentag', {name: 'script', attributes: {}, isSelfClosing: false}],
      ['text', 'hello world'],
      ['closetag', 'script'],
      ['closetag', 'xml']
    ],
    saxOptions: {
      strict: false,
      lowercasetags: true,
      noscript: true
    }
  });

  testSax(t, {
    xml: '<xml><script><![CDATA[hello world]]></script></xml>',
    expect: [
      ['opentagstart', {name: 'xml', attributes: {}}],
      ['opentag', {name: 'xml', attributes: {}, isSelfClosing: false}],
      ['opentagstart', {name: 'script', attributes: {}}],
      ['opentag', {name: 'script', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', 'hello world'],
      ['closecdata', undefined],
      ['closetag', 'script'],
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
