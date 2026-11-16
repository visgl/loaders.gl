// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {loadNodeWasmInput} from '../../../../website/src/alternate-loaders/parquet/load-wasm-node';

test('website comparison backend loads its dependency-owned WASM asset in Node', async () => {
  const bytes = await loadNodeWasmInput();
  expect(bytes).toBeInstanceOf(Uint8Array);
  expect(Array.from(bytes!.subarray(0, 4))).toEqual([0, 97, 115, 109]);
});
