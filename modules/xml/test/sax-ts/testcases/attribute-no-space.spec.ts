// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {testSax} from '../utils/test-utils';

// non-strict: no error
test('SAXParser#attribute-no-space', (t) => {
  testSax(t, {
    xml: '<root attr1="first"attr2="second"/>',
    expect: [
      ['opentagstart', {name: 'root', attributes: {}}],
      ['attribute', {name: 'attr1', value: 'first'}],
      ['attribute', {name: 'attr2', value: 'second'}],
      [
        'opentag',
        {
          name: 'root',
          attributes: {attr1: 'first', attr2: 'second'},
          isSelfClosing: true
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: false,
      lowercase: true
    }
  });

  // strict: should give an error, but still parse
  testSax(t, {
    xml: '<root attr1="first"attr2="second"/>',
    expect: [
      ['opentagstart', {name: 'root', attributes: {}}],
      ['attribute', {name: 'attr1', value: 'first'}],
      ['error', 'No whitespace between attributes\nLine: 0\nColumn: 20\nChar: a'],
      ['attribute', {name: 'attr2', value: 'second'}],
      [
        'opentag',
        {
          name: 'root',
          attributes: {attr1: 'first', attr2: 'second'},
          isSelfClosing: true
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: true
    }
  });

  // strict: other cases should still pass
  testSax(t, {
    xml: '<root attr1="first" attr2="second"/>',
    expect: [
      ['opentagstart', {name: 'root', attributes: {}}],
      ['attribute', {name: 'attr1', value: 'first'}],
      ['attribute', {name: 'attr2', value: 'second'}],
      [
        'opentag',
        {
          name: 'root',
          attributes: {attr1: 'first', attr2: 'second'},
          isSelfClosing: true
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: true
    }
  });

  // strict: other cases should still pass
  testSax(t, {
    xml: '<root attr1="first"\nattr2="second"/>',
    expect: [
      ['opentagstart', {name: 'root', attributes: {}}],
      ['attribute', {name: 'attr1', value: 'first'}],
      ['attribute', {name: 'attr2', value: 'second'}],
      [
        'opentag',
        {
          name: 'root',
          attributes: {attr1: 'first', attr2: 'second'},
          isSelfClosing: true
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: true
    }
  });

  // strict: other cases should still pass
  testSax(t, {
    xml: '<root attr1="first"  attr2="second"/>',
    expect: [
      ['opentagstart', {name: 'root', attributes: {}}],
      ['attribute', {name: 'attr1', value: 'first'}],
      ['attribute', {name: 'attr2', value: 'second'}],
      [
        'opentag',
        {
          name: 'root',
          attributes: {attr1: 'first', attr2: 'second'},
          isSelfClosing: true
        }
      ],
      ['closetag', 'root']
    ],
    saxOptions: {
      strict: true
    }
  });

  t.end();
});
