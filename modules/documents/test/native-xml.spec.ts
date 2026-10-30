// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseXMLSync, validateXML} from '@loaders.gl/documents/xml-parser';
import {HTMLLoaderWithParser} from '@loaders.gl/documents/html-loader';

test('native XML preserves text chunks, CDATA, namespace and scalar policies', () => {
  expect(
    parseXMLSync(
      '<root><text> hello <![CDATA[world]]> ! </text><n>42</n><b>true</b><empty/></root>'
    )
  ).toEqual({root: {text: 'hello world !', n: 42, b: true, empty: ''}});
  expect(
    parseXMLSync('<g:root xmlns:g="urn:g"><g:item n="001"> 001 </g:item></g:root>', {
      removeNSPrefix: true,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      trimValues: false,
      parseTagValue: false
    })
  ).toEqual({root: {item: {'@_n': '001', '#text': ' 001 '}}});
  expect(
    parseXMLSync('<root n="001" enabled="true">2</root>', {
      attributesGroupName: 'attr',
      parseAttributeValue: true
    })
  ).toEqual({root: {attr: {n: 1, enabled: true}, value: 2}});
});

test('native XML handles arrays, ignored attributes and alternate text keys', () => {
  expect(
    parseXMLSync('<root><item>1</item><item>2</item><only a="x">3</only></root>', {
      arrayPaths: ['root.only'],
      ignoreAttributes: true
    })
  ).toEqual({root: {item: [1, 2], only: [3]}});
  expect(parseXMLSync('<root/>', {arrayPaths: ['root']})).toEqual({root: ['']});
  expect(
    parseXMLSync('<Root><ChildValue a="  x  ">word</ChildValue></Root>', {
      uncapitalizeKeys: true,
      textNodeName: '_text'
    })
  ).toEqual({root: {childValue: {a: 'x', _text: 'word'}}});
});

test('native XML preserves entity spellings when requested and never resolves external DTDs', () => {
  expect(parseXMLSync('<root a="&amp;">&lt;&amp;&#65;</root>', {processEntities: false})).toEqual({
    root: {a: '&amp;', value: '&lt;&amp;&#65;'}
  });
  expect(
    parseXMLSync(
      '<!DOCTYPE root SYSTEM "https://example.invalid/never-fetch.dtd"><root>&amp;&#65;</root>'
    )
  ).toEqual({root: '&A'});
  expect(() =>
    parseXMLSync('<!DOCTYPE root [<!ENTITY custom "expanded">]><root>&custom;</root>')
  ).toThrow();
});

test('native XML treats prototype-shaped fields as own data', () => {
  const parsed = parseXMLSync(
    '<root __proto__="value" hasOwnProperty="safe"><constructor>x</constructor><toString>y</toString></root>'
  );
  expect(Object.hasOwn(parsed.root, '__proto__')).toBe(true);
  expect(parsed.root.__proto__).toBe('value');
  expect(parsed.root.constructor).toBe('x');
  expect(parsed.root.toString).toBe('y');
  expect(Object.getPrototypeOf(parsed.root)).toBe(Object.prototype);
  expect(
    parseXMLSync('<Root><__proto__>x</__proto__></Root>', {uncapitalizeKeys: true}).root.__proto__
  ).toBe('x');
});

test.each([
  '',
  'text',
  '<a/><b/>',
  '<a><b></a>',
  '<a/> trailing',
  '<a>&unknown;</a>',
  '<a>&constructor;</a>',
  '<a>&#0;</a>',
  '<a>&#x110000;</a>',
  '<a>&#xD800;</a>',
  '<a x="1" x="2"/>',
  '<a>\u0000</a>',
  '<a x="unterminated></a>'
])('native XML rejects invalid document %j', text => {
  expect(() => parseXMLSync(text)).toThrow();
  expect(validateXML(text)).toBeInstanceOf(Error);
});

test('native XML validates and bounds element nesting', () => {
  expect(validateXML('<root/>')).toBe(true);
  expect(() => parseXMLSync('<a><b/></a>', {maxDepth: 1})).toThrow('maximum nesting');
  for (const maxDepth of [0, -1, 4097, 1.5, NaN, Infinity])
    expect(() => parseXMLSync('<a/>', {maxDepth})).toThrow('maxDepth');
});

test('HTML retains legacy tolerance, authored case and HTML entities', () => {
  expect(
    HTMLLoaderWithParser.parseTextSync('<Html><body><img src="x"><br>&nbsp;</body></Html>')
  ).toMatchObject({Html: {body: {img: {src: 'x'}}}});
  expect(parseXMLSync('<root>&nbsp;</root>', {htmlEntities: true, trimValues: false})).toEqual({
    root: '\u00a0'
  });
});

test('HTML callers can opt into strict XML and override whitespace defaults', () => {
  expect(() => HTMLLoaderWithParser.parseTextSync('<a><b></a>', {xml: {strict: true}})).toThrow();
  expect(HTMLLoaderWithParser.parseTextSync('<a>  text  </a>', {xml: {trimValues: false}})).toEqual(
    {a: '  text  '}
  );
});

test('native XML reports removed backend options instead of silently changing their meaning', () => {
  expect(() => parseXMLSync('<root/>', {_fastXML: {parseTagValue: false}} as any)).toThrow(
    'backend-specific options'
  );
  expect(() => parseXMLSync('<root/>', {_sax: {}} as any)).toThrow('backend-specific options');
  expect(() => parseXMLSync('<root/>', {_parser: 'fast-xml-parser'} as any)).toThrow(
    'unsupported parser backend'
  );
  expect(parseXMLSync('<root/>', {_parser: 'sax'})).toEqual({root: ''});
});
