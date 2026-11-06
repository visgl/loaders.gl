// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseUSDC} from '../../src/usd/lib/parse-usdc';

test('USDC decodes a million compressed integer values within its storage budget', async () => {
  const source = await (
    await fetch(new URL('./data/large-indices.usdc', import.meta.url))
  ).arrayBuffer();
  const values = parseUSDC(source).rootPrims[0].attributes.indices.value as number[];
  expect(values.length).toBe(1_000_000);
  expect(values.every(value => value === 0)).toBe(true);
});

test('USDC rebuilds a wide assembly without consuming the JavaScript call stack', async () => {
  const source = await (
    await fetch(new URL('./data/wide-assembly.usdc', import.meta.url))
  ).arrayBuffer();
  const children = parseUSDC(source).rootPrims[0].children;
  expect(children.length).toBe(12_000);
  expect(children[0].name).toBe('Part00000');
  expect(children[children.length - 1].name).toBe('Part11999');
  expect(
    children.every(prim => prim.children.length === 1 && prim.children[0].type === 'Mesh')
  ).toBe(true);
});
