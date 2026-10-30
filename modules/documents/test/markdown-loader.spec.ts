// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {MarkdownLoader} from '@loaders.gl/documents';
import {MarkdownLoaderWithParser} from '@loaders.gl/documents/markdown-loader';
import {parseMarkdownSync} from '../src/lib/parsers/parse-markdown';

describe('MarkdownLoader', () => {
  test('keeps metadata lazy and supports async preload and sync parser imports', async () => {
    expect(MarkdownLoader).not.toHaveProperty('parse');
    expect(MarkdownLoader.module).toBe('documents');
    const expected = {
      type: 'root',
      children: [{type: 'heading', depth: 1, children: [{type: 'text', value: 'Title'}]}]
    };
    expect(await parse('# Title', MarkdownLoader)).toEqual(expected);
    expect(parseSync('# Title', MarkdownLoaderWithParser)).toEqual(expected);
    expect(
      await MarkdownLoaderWithParser.parse(new TextEncoder().encode('# Title').buffer)
    ).toEqual(expected);
  });

  test('parses headings, paragraphs, fences, quotes, lists and thematic breaks', () => {
    expect(
      parseMarkdownSync(
        '\uFEFF# Title ###\r\n\r\none\rtwo\n\n```ts\nconst x = 1;\n```\n> quote\n>\n> > nested\n- first\n+ second\n3. third\n4) fourth\n***'
      )
    ).toEqual({
      type: 'root',
      children: [
        {type: 'heading', depth: 1, children: [{type: 'text', value: 'Title'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'one\ntwo'}]},
        {type: 'code', language: 'ts', value: 'const x = 1;'},
        {
          type: 'blockquote',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'quote'}]},
            {
              type: 'blockquote',
              children: [{type: 'paragraph', children: [{type: 'text', value: 'nested'}]}]
            }
          ]
        },
        {
          type: 'list',
          ordered: false,
          items: [[{type: 'text', value: 'first'}], [{type: 'text', value: 'second'}]]
        },
        {
          type: 'list',
          ordered: true,
          start: 3,
          items: [[{type: 'text', value: 'third'}], [{type: 'text', value: 'fourth'}]]
        },
        {type: 'thematicBreak'}
      ]
    });
  });

  test('parses inline markup and keeps HTML and destinations as data', () => {
    expect(
      parseMarkdownSync(
        'a *em* **strong** _em_ __strong__ `code` [*link*](https://example.com) ![alt](image.png) \\*literal\\* <script>x</script>'
      ).children
    ).toEqual([
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'a '},
          {type: 'emphasis', children: [{type: 'text', value: 'em'}]},
          {type: 'text', value: ' '},
          {type: 'strong', children: [{type: 'text', value: 'strong'}]},
          {type: 'text', value: ' '},
          {type: 'emphasis', children: [{type: 'text', value: 'em'}]},
          {type: 'text', value: ' '},
          {type: 'strong', children: [{type: 'text', value: 'strong'}]},
          {type: 'text', value: ' '},
          {type: 'code', value: 'code'},
          {type: 'text', value: ' '},
          {
            type: 'link',
            url: 'https://example.com',
            children: [{type: 'emphasis', children: [{type: 'text', value: 'link'}]}]
          },
          {type: 'text', value: ' '},
          {type: 'image', alt: 'alt', url: 'image.png'},
          {type: 'text', value: ' *literal* <script>x</script>'}
        ]
      }
    ]);
    expect(parseMarkdownSync('[x](javascript:alert)')).toMatchObject({
      children: [{children: [{type: 'link', url: 'javascript:alert'}]}]
    });
  });

  test.each(['', '\n\n'])('parses empty input %j', text => {
    expect(parseMarkdownSync(text)).toEqual({type: 'root', children: []});
  });
  test.each(['---', '___', '* * *'])('recognizes thematic break %s', text => {
    expect(parseMarkdownSync(text).children).toEqual([{type: 'thematicBreak'}]);
  });
  test.each([
    '*unclosed',
    '`unclosed',
    '[unclosed',
    '[x](unclosed',
    '(prefix) [',
    '] stray ) [',
    '![](',
    '\\'
  ])('preserves unmatched syntax %s', text => {
    expect(parseMarkdownSync(text).children).toEqual([
      {type: 'paragraph', children: [{type: 'text', value: text}]}
    ]);
  });
  test('handles longer and unclosed fences, literal code and indented text', () => {
    expect(parseMarkdownSync('~~~~\na\n~~~\nb\n~~~~\n~~~\nunclosed').children).toEqual([
      {type: 'code', value: 'a\n~~~\nb'},
      {type: 'code', value: 'unclosed'}
    ]);
    expect(parseMarkdownSync('    # literal\n``a ` b``').children).toEqual([
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: '    # literal\n'},
          {type: 'code', value: 'a ` b'}
        ]
      }
    ]);
  });
  test.each([0, -1, 129, 1.5, NaN, Infinity])('rejects invalid nesting limit %s', maxDepth => {
    expect(() => parseMarkdownSync('', {maxDepth})).toThrow('maxDepth');
  });
  test('bounds recursive quotes and inline content', () => {
    expect(() => parseMarkdownSync('> > nested', {maxDepth: 2})).toThrow('maximum nesting');
    expect(() => parseMarkdownSync('*nested*', {maxDepth: 1})).toThrow('maximum nesting');
    expect(() => parseMarkdownSync('9007199254740993. item')).toThrow('ordered-list start');
    expect(parseMarkdownSync('*'.repeat(10000)).children).toEqual([{type: 'thematicBreak'}]);
    expect(parseMarkdownSync('['.repeat(10000)).children).toHaveLength(1);
  });
});

test.each([
  [
    '[plain] then [link](target)',
    '[plain] then ',
    {type: 'link', url: 'target', children: [{type: 'text', value: 'link'}]}
  ],
  [
    '[unclosed then [link](target)',
    '[unclosed then ',
    {type: 'link', url: 'target', children: [{type: 'text', value: 'link'}]}
  ],
  [
    '![plain] then ![image](target)',
    '![plain] then ',
    {type: 'image', url: 'target', alt: 'image'}
  ],
  ['[plain] then ![image](target)', '[plain] then ', {type: 'image', url: 'target', alt: 'image'}],
  [
    '[bad](unclosed then [link](target)',
    '[bad](unclosed then ',
    {type: 'link', url: 'target', children: [{type: 'text', value: 'link'}]}
  ]
] as const)('keeps earlier bracket text separate in %s', (text, prefix, node) => {
  expect(parseMarkdownSync(text).children).toEqual([
    {type: 'paragraph', children: [{type: 'text', value: prefix}, node]}
  ]);
});

test('matches nested and escaped delimiters without truncating links', () => {
  expect(
    parseMarkdownSync('[a [bracket] and \\] label](https://example.com/a(b)) ![a \\] b](image.png)')
      .children
  ).toEqual([
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://example.com/a(b)',
          children: [{type: 'text', value: 'a [bracket] and ] label'}]
        },
        {type: 'text', value: ' '},
        {type: 'image', url: 'image.png', alt: 'a \\] b'}
      ]
    }
  ]);
});

test('keeps bracket and parenthesis characters inside code spans literal in link labels', () => {
  expect(
    parseMarkdownSync('[use `[literal](ignored` safely](target) after `[not](link)`').children
  ).toEqual([
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'target',
          children: [
            {type: 'text', value: 'use '},
            {type: 'code', value: '[literal](ignored'},
            {type: 'text', value: ' safely'}
          ]
        },
        {type: 'text', value: ' after '},
        {type: 'code', value: '[not](link)'}
      ]
    }
  ]);
});
