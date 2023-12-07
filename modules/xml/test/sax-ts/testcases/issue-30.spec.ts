// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// https://github.com/isaacs/sax-js/issues/33
test(`SAXParser#${__filename}`, (t) => {
  testSax(t, {
    xml:
      '<xml>\n' +
      '<!-- \n' +
      '  comment with a single dash- in it\n' +
      '-->\n' +
      '<data/>\n' +
      '</xml>',
    expect: [
      ['opentagstart', {name: 'xml', attributes: {}}],
      ['opentag', {name: 'xml', attributes: {}, isSelfClosing: false}],
      ['text', '\n'],
      ['comment', ' \n  comment with a single dash- in it\n'],
      ['text', '\n'],
      ['opentagstart', {name: 'data', attributes: {}}],
      ['opentag', {name: 'data', attributes: {}, isSelfClosing: true}],
      ['closetag', 'data'],
      ['text', '\n'],
      ['closetag', 'xml']
    ],
    saxOptions: {
      strict: true
    }
  });

  t.end();
});
