// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import draco3d from 'draco3d';
import {isBrowser} from '@loaders.gl/worker-utils';

import {DracoLoader} from '../src/draco-loader';
import {Draco3DLoaderWithParser} from '../src/draco3d-loader-with-parser';
import {DracoJavaScriptLoaderWithParser} from '../src/draco-javascript-loader-with-parser';
import {DracoWASMLoaderWithParser} from '../src/draco-wasm-loader-with-parser';
import {loadDracoDecoderModule, loadDracoEncoderModule} from '../src/lib/draco-module-loader';

test('DracoLoader#preload selects backend loader', async t => {
  t.equal(
    await DracoLoader.preload?.('', {draco: {backend: 'wasm'}}),
    DracoWASMLoaderWithParser,
    'selects the WASM backend loader'
  );
  t.equal(
    await DracoLoader.preload?.('', {draco: {backend: 'javascript'}}),
    DracoJavaScriptLoaderWithParser,
    'selects the JavaScript backend loader'
  );
  t.equal(
    await DracoLoader.preload?.('', {draco: {backend: 'draco3d'}, modules: {draco3d}}),
    Draco3DLoaderWithParser,
    'selects the injected draco3d backend loader'
  );
  t.equal(
    await DracoLoader.preload?.('', {draco: {decoderType: 'js'}}),
    DracoJavaScriptLoaderWithParser,
    'maps legacy decoderType to the JavaScript backend loader'
  );
  t.end();
});

test('draco-module-loader#uses injected decoder module', async t => {
  if (isBrowser) {
    t.comment('Skipping Draco WASM module test in browser');
    t.end();
    return;
  }
  const module = await loadDracoDecoderModule(
    {
      modules: {
        draco3d
      }
    },
    'wasm'
  );

  t.ok(module.draco, 'returns a decoder instance from the injected draco3d package');
  t.end();
});

test('draco-module-loader#uses injected encoder module', async t => {
  if (isBrowser) {
    t.comment('Skipping Draco WASM module test in browser');
    t.end();
    return;
  }
  const module = await loadDracoEncoderModule({
    modules: {
      draco3d
    }
  });

  t.ok(module.draco, 'returns an encoder instance from the injected draco3d package');
  t.end();
});
