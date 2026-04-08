// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {loadDracoDecoderModule, loadDracoEncoderModule} from '../src/lib/draco-module-loader';

test('draco-module-loader#uses local decoder module', async t => {
  const module = await loadDracoDecoderModule(
    {
      useLocalLibraries: true
    },
    'wasm'
  );

  t.ok(module.draco, 'returns a decoder instance from the injected draco3d package');
  t.end();
});

test('draco-module-loader#uses local encoder module', async t => {
  const module = await loadDracoEncoderModule({
    useLocalLibraries: true
  });

  t.ok(module.draco, 'returns an encoder instance from the injected draco3d package');
  t.end();
});
