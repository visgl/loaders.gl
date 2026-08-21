// SPDX-License-Identifier: ISC

import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
// default to uppercase
test('SAXParser#case', () => {
  testSax({
    xml: '<span class="test" hello="world"></span>',
    expect: [
      [
        'opentagstart',
        {
          name: 'SPAN',
          attributes: {}
        }
      ],
      ['attribute', {name: 'CLASS', value: 'test'}],
      ['attribute', {name: 'HELLO', value: 'world'}],
      [
        'opentag',
        {
          name: 'SPAN',
          attributes: {CLASS: 'test', HELLO: 'world'},
          isSelfClosing: false
        }
      ],
      ['closetag', 'SPAN']
    ],
    saxOptions: {
      strict: false
    }
  });
  // lowercase option : lowercase tag/attribute names
  testSax({
    xml: '<span class="test" hello="world"></span>',
    expect: [
      [
        'opentagstart',
        {
          name: 'span',
          attributes: {}
        }
      ],
      ['attribute', {name: 'class', value: 'test'}],
      ['attribute', {name: 'hello', value: 'world'}],
      [
        'opentag',
        {
          name: 'span',
          attributes: {class: 'test', hello: 'world'},
          isSelfClosing: false
        }
      ],
      ['closetag', 'span']
    ],
    saxOptions: {
      strict: false,
      lowercase: true
    }
  });
  // backward compatibility with old lowercasetags opt
  testSax({
    xml: '<span class="test" hello="world"></span>',
    expect: [
      [
        'opentagstart',
        {
          name: 'span',
          attributes: {}
        }
      ],
      ['attribute', {name: 'class', value: 'test'}],
      ['attribute', {name: 'hello', value: 'world'}],
      [
        'opentag',
        {
          name: 'span',
          attributes: {class: 'test', hello: 'world'},
          isSelfClosing: false
        }
      ],
      ['closetag', 'span']
    ],
    saxOptions: {
      lowercasetags: true
    }
  });
});
