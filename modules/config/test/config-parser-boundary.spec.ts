// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseTOMLSync} from '../src/toml/lib/parsers/parse-toml';
import {parseYAMLSync} from '../src/yaml/lib/parsers/parse-yaml';

describe('YAML parser boundary behavior', () => {
  test('parses block, flow, scalar, numeric, and string forms', () => {
    expect(
      parseYAMLSync(
        `
---
items:
  - name: first
    enabled: yes
  -
    name: second
flow: {plain: [null, true, false, 0x10, 0o10, 0b10, 1_000, .5e2], "quoted:key": "a\\n\\u0042"}
literal: |-
  first
  second
folded: >+
  one
  two
anchor: &value retained
single: 'it''s fine'
...
`,
        {version: '1.1'}
      )
    ).toMatchObject({
      items: [{name: 'first', enabled: true}, {name: 'second'}],
      flow: {
        plain: [null, true, false, 16, 8, 2, 1000, 50],
        'quoted:key': 'a\nB'
      },
      literal: 'first\nsecond',
      folded: 'one two\n',
      anchor: 'retained',
      single: "it's fine"
    });
    expect(parseYAMLSync('\uFEFFvalue: 9007199254740993', {intAsBigInt: true})).toEqual({
      value: 9007199254740993n
    });
    expect(parseYAMLSync('')).toBeNull();
  });

  test.each([
    ['duplicate mapping key', 'a: 1\na: 2', {uniqueKeys: true}, 'Duplicate mapping key'],
    ['unknown alias', 'value: *missing', {}, 'Unknown YAML alias'],
    ['unexpected indentation', '  value: 1\nnext: 2', {}, 'Unexpected content'],
    ['flow object colon', 'value: {key 1}', {}, 'Expected colon'],
    ['unterminated string', 'value: "open', {}, 'Unterminated quoted string'],
    ['trailing scalar content', 'value: "done" extra', {}, 'Unexpected trailing content'],
    ['non-string flow key', 'value: {1: one}', {stringKeys: true}, 'Mapping keys must be strings']
  ])('rejects %s', (_name, text, options, message) => {
    expect(() => parseYAMLSync(text, options)).toThrow(message);
  });
});

describe('TOML parser boundary behavior', () => {
  test('parses tables, arrays, inline tables, scalars, dates, and multiline strings', () => {
    const value = parseTOMLSync(`
title = "hash # retained" # removed
escaped = "a\\n\\u0042\\U00000043"
literal = 'raw'
multiline = """
line one
line two"""
values = [true, false, +inf, -inf, nan, 0x10, 0o10, 0b10, 1_000, 1.5e2]
date = 2026-08-29T12:30:00Z
inline = {nested.value = 2, name = "demo"}
[owner]
name = "one"
[[products]]
name = "first"
[products.details]
weight = 1
[[products]]
name = "second"
`);

    expect(value).toMatchObject({
      title: 'hash # retained',
      escaped: 'a\nBC',
      literal: 'raw',
      multiline: 'line one\nline two',
      inline: {nested: {value: 2}, name: 'demo'},
      owner: {name: 'one'},
      products: [{name: 'first', details: {weight: 1}}, {name: 'second'}]
    });
    expect((value.values as number[]).slice(0, 4)).toEqual([true, false, Infinity, -Infinity]);
    expect(Number.isNaN((value.values as number[])[4])).toBe(true);
    expect((value.values as number[]).slice(5)).toEqual([16, 8, 2, 1000, 150]);
    expect(value.date).toEqual(new Date('2026-08-29T12:30:00Z'));
    expect(parseTOMLSync('\uFEFFlarge = 9007199254740993', {integersAsBigInt: 'asNeeded'})).toEqual(
      {
        large: 9007199254740993n
      }
    );
    expect(parseTOMLSync('small = 2', {integersAsBigInt: true})).toEqual({small: 2n});
  });

  test.each([
    ['missing assignment', 'invalid', 'Expected a key/value assignment'],
    ['duplicate key', 'value = 1\nvalue = 2', 'Duplicate key'],
    ['scalar table conflict', 'value = 1\n[value]', 'Cannot redefine'],
    ['array table conflict', 'value = 1\n[[value]]', 'Cannot redefine'],
    ['dotted scalar conflict', 'value = 1\nvalue.child = 2', 'Cannot create dotted key'],
    ['invalid scalar', 'value = nope', 'Invalid value'],
    ['unterminated string', 'value = "open', 'Unterminated string'],
    ['invalid escape', 'value = "\\q"', 'Invalid escape sequence'],
    ['array punctuation', 'value = [1 2]', 'Expected comma'],
    ['inline equals', 'value = {key}', 'Expected equals sign'],
    ['inline punctuation', 'value = {key = 1 other = 2}', 'Expected comma'],
    ['inline duplicate', 'value = {key = 1, key = 2}', 'Duplicate key'],
    ['inline dotted conflict', 'value = {key = 1, key.child = 2}', 'Cannot create dotted key'],
    ['unterminated key', '["key]', 'Unterminated quoted key'],
    ['invalid key', 'bad$key = 1', 'Invalid key'],
    ['missing dotted key', 'value. = 1', 'Empty key']
  ])('rejects %s', (_name, text, message) => {
    expect(() => parseTOMLSync(text)).toThrow(message);
  });
});
