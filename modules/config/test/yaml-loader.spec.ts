// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, parse} from '@loaders.gl/core';
import {YAMLLoader as BundledYAMLLoader} from '@loaders.gl/config/bundled';
import {YAMLLoader as UnbundledYAMLLoader} from '@loaders.gl/config/unbundled';
import {YAMLFormat, YAMLLoader} from '@loaders.gl/config';

const YAML_TEXT = `
name: loaders.gl
enabled: true
count: 3
items:
  - id: first
    values: [1, 2]
  - id: second
    values: [3, 4]
`;

test('YAMLLoader exposes format metadata', () => {
  expect(YAMLLoader).toMatchObject(YAMLFormat);
  expect(YAMLLoader.extensions).toEqual(['yaml', 'yml']);
  expect(YAMLLoader.mimeTypes).toContain('application/yaml');
});

test('bundled YAMLLoader parses text synchronously', () => {
  const value = BundledYAMLLoader.parseTextSync?.(YAML_TEXT) as {
    name: string;
    enabled: boolean;
    count: number;
    items: Array<{id: string; values: number[]}>;
  };

  expect(value).toEqual({
    name: 'loaders.gl',
    enabled: true,
    count: 3,
    items: [
      {id: 'first', values: [1, 2]},
      {id: 'second', values: [3, 4]}
    ]
  });
});

test('bundled YAMLLoader parses ArrayBuffers asynchronously', async () => {
  const value = await BundledYAMLLoader.parse?.(new TextEncoder().encode('answer: 42').buffer);
  expect(value).toEqual({answer: 42});
});

test('unbundled YAMLLoader preloads its parser', async () => {
  expect('parse' in UnbundledYAMLLoader).toBe(false);

  const value = await parse('name: loaders.gl', UnbundledYAMLLoader);
  expect(value).toEqual({name: 'loaders.gl'});
});

test('YAMLLoader works with load and loader options', async () => {
  const value = await load(new TextEncoder().encode('enabled: YES').buffer, YAMLLoader, {
    yaml: {version: '1.1'}
  });
  expect(value).toEqual({enabled: true});
});

test('YAMLLoader preserves hashes in plain scalars and blank block-scalar lines', () => {
  const value = BundledYAMLLoader.parseTextSync?.(`
url: https://example.test/#section # trailing comment
message: |
  first

  second
`);

  expect(value).toEqual({
    url: 'https://example.test/#section',
    message: 'first\n\nsecond\n'
  });
});

test('YAMLLoader enforces string keys', () => {
  expect(() => BundledYAMLLoader.parseTextSync?.('1: value', {yaml: {stringKeys: true}})).toThrow(
    'Mapping keys must be strings'
  );
  expect(() =>
    BundledYAMLLoader.parseTextSync?.('{true: value}', {yaml: {stringKeys: true}})
  ).toThrow('Mapping keys must be strings');
});
