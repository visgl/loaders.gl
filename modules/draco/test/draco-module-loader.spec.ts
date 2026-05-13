// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import draco3d from 'draco3d';
import {isBrowser} from '@loaders.gl/worker-utils';

import {loadDracoDecoderModule, loadDracoEncoderModule} from '../src/lib/draco-module-loader';

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
