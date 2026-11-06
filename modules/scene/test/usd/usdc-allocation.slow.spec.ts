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
