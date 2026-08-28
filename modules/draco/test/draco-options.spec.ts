// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {DracoLoader} from '@loaders.gl/draco';
import {Draco3DLoaderWithParser} from '../src/draco3d-loader-with-parser';
import {DracoJavaScriptLoaderWithParser} from '../src/draco-javascript-loader-with-parser';
import {DracoWASMLoaderWithParser} from '../src/draco-wasm-loader-with-parser';

test.each([
  ['wasm', DracoWASMLoaderWithParser],
  ['javascript', DracoJavaScriptLoaderWithParser],
  ['js', DracoJavaScriptLoaderWithParser],
  ['draco3d', Draco3DLoaderWithParser]
])('DracoLoader accepts the %s backend option', async (backend, expectedLoader) => {
  const loader = await DracoLoader.preload?.('', {
    draco: {backend}
  });

  expect(loader).toBe(expectedLoader);
});

test('DracoLoader defaults to the configured platform backend', async () => {
  const loader = await DracoLoader.preload?.('');
  expect(loader).toBe(
    DracoLoader.options.draco.backend === 'wasm'
      ? DracoWASMLoaderWithParser
      : DracoJavaScriptLoaderWithParser
  );
});

test('DracoLoader rejects unsupported backend options', async () => {
  await expect(
    DracoLoader.preload?.('', {draco: {backend: 'unsupported' as never}})
  ).rejects.toThrow('unsupported backend');
});

test('Draco3D parser requires an injected draco3d module', async () => {
  await expect(Draco3DLoaderWithParser.parse(new ArrayBuffer(0), {})).rejects.toThrow(
    'requires options.modules.draco3d'
  );
});
