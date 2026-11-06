// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {beforeAll, expect, test} from 'vitest';
import {parseUSDA} from '../../src/usd/lib/parse-usda';
import {parseUSDC} from '../../src/usd/lib/parse-usdc';
import {USDLoaderWithParser} from '../../src/usd-loader';
import {USDCParser} from '../../src/usd/libs/usdc-parser';

let fixtureBuffer: ArrayBuffer;
let dictionaryOffset: number;
beforeAll(async () => {
  fixtureBuffer = await (
    await fetch(new URL('./data/dictionary.usdc', import.meta.url))
  ).arrayBuffer();
  const decoder = new USDCParser() as USDCParser & {
    reader: {tell: () => number};
    _readDictionary: () => unknown;
  };
  const original = decoder._readDictionary.bind(decoder);
  const offsets: number[] = [];
  decoder._readDictionary = () => {
    offsets.push(decoder.reader.tell());
    return original();
  };
  decoder.parseData(fixtureBuffer);
  dictionaryOffset = offsets[0];
  expect(dictionaryOffset).toBeGreaterThan(0);
});

test('USDC dictionaries match equivalent USDA layer and prim metadata', async () => {
  const [binary, text] = await Promise.all([
    fetch(new URL('./data/dictionary.usdc', import.meta.url)).then(response =>
      response.arrayBuffer()
    ),
    fetch(new URL('./data/dictionary.usda', import.meta.url)).then(response => response.text())
  ]);
  const actual = parseUSDC(binary);
  const expected = parseUSDA(text);
  expect(actual.metadata).toEqual(expected.metadata);
  expect(actual.rootPrims).toEqual(expected.rootPrims);
});

test.each([
  'dictionary.usdz',
  'dictionary-binary-usd.usdz'
])('USDZ preserves binary-root dictionary metadata in %s', async filename => {
  const bytes = await (await fetch(new URL('./data/' + filename, import.meta.url))).arrayBuffer();
  const stage = await USDLoaderWithParser.parse(bytes, {usd: {compose: false}});
  expect(stage.format).toBe('usdz');
  expect(stage.rootPrims[0].name).toBe('World');
  expect(stage.metadata.customLayerData).toEqual({author: 'loaders.gl', revision: 2});
  expect(stage.rootPrims[0].metadata.customData).toEqual({
    description: 'metadata fixture',
    disabled: false,
    texture: {assetPath: 'textures/grade.png'},
    emptyMetadata: {},
    nested: {scale: 1.5, samples: [1, 2, 3], empty: ''}
  });
  expect(stage.layers).toContain(stage.url);
});

test('USDZ requires its first file to be the root layer instead of selecting a later USD entry', async () => {
  const source = await (
    await fetch(new URL('./data/dictionary-binary-usd.usdz', import.meta.url))
  ).arrayBuffer();
  const bytes = new Uint8Array(source);
  const original = new TextEncoder().encode('root.usd');
  const renamed = new TextEncoder().encode('root.png');
  for (let index = 0; index <= bytes.length - original.length; index++) {
    if (original.every((value, component) => bytes[index + component] === value))
      bytes.set(renamed, index);
  }
  await expect(USDLoaderWithParser.parse(source, {usd: {compose: false}})).rejects.toThrow(
    /root layer/
  );
});

test.each([
  ['allocation limit', /decoded allocation limit/],
  ['truncated entries', /truncated dictionary entries/],
  ['invalid key', /invalid dictionary key/],
  ['duplicate key', /invalid dictionary key/],
  ['invalid offset', /invalid dictionary value offset/],
  ['cyclic value', /cyclic dictionary/],
  ['unsupported value', /unsupported dictionary value type/]
] as const)('USDC dictionaries reject %s', (mutation, error) => {
  const source = fixtureBuffer.slice(0);
  const view = new DataView(source);
  const firstKey = dictionaryOffset + 8;
  const firstOffset = firstKey + 4;
  const representation = firstOffset + Number(view.getBigInt64(firstOffset, true));
  switch (mutation) {
    case 'allocation limit':
      view.setBigUint64(dictionaryOffset, 4_000_001n, true);
      break;
    case 'truncated entries':
      view.setBigUint64(dictionaryOffset, BigInt(Math.floor(source.byteLength / 20) + 1), true);
      break;
    case 'invalid key':
      view.setUint32(firstKey, 0xffffffff, true);
      break;
    case 'duplicate key':
      view.setUint32(representation + 8, view.getUint32(firstKey, true), true);
      break;
    case 'invalid offset':
      view.setBigInt64(firstOffset, 0n, true);
      break;
    case 'cyclic value':
      view.setUint32(representation, dictionaryOffset, true);
      view.setUint32(representation + 4, 31 << 16, true);
      break;
    case 'unsupported value':
      view.setUint32(representation + 4, 60 << 16, true);
      break;
  }
  expect(() => parseUSDC(source)).toThrow(error);
});

test('USDC dictionaries bound nesting depth', async () => {
  const source = await (
    await fetch(new URL('./data/dictionary-depth.usdc', import.meta.url))
  ).arrayBuffer();
  expect(() => parseUSDC(source)).toThrow(/dictionary depth limit/);
});

test('USDC dictionary special keys remain own data properties', async () => {
  const source = await (
    await fetch(new URL('./data/dictionary-special-keys.usdc', import.meta.url))
  ).arrayBuffer();
  const metadata = parseUSDC(source).rootPrims[0].metadata.customData as Record<string, unknown>;
  expect(Object.hasOwn(metadata, '__proto__')).toBe(true);
  expect(metadata.__proto__).toBe('retained');
  expect(metadata.constructor).toBe('ordinary data');
  expect(Object.getPrototypeOf(metadata)).toBeNull();
});
