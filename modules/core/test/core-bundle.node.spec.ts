// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {expect, test} from 'vitest';

test.each(['dist.min.js', 'dist.dev.js'])('core bundle %s exports compareLoaderOptions', bundle => {
  const scope = {console, TextEncoder, TextDecoder, loaders: {}};
  const source = readFileSync(new URL(`../dist/${bundle}`, import.meta.url), 'utf8');
  runInNewContext(source, scope);
  expect(scope.loaders).toHaveProperty('compareLoaderOptions', expect.any(Function));
});

test.each([
  'crypto/dist/dist.min.js',
  'tiles/dist/mvt/dist.min.js'
])('%s preserves compareLoaderOptions when loaded after core', bundle => {
  const scope = {console, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout, loaders: {}};
  const coreSource = readFileSync(new URL('../dist/dist.min.js', import.meta.url), 'utf8');
  const addonSource = readFileSync(new URL(`../../${bundle}`, import.meta.url), 'utf8');
  runInNewContext(coreSource, scope);
  const {compareLoaderOptions} = scope.loaders as {compareLoaderOptions: unknown};

  runInNewContext(addonSource, scope);
  expect(compareLoaderOptions).toBeTypeOf('function');
  expect(scope.loaders).toHaveProperty('compareLoaderOptions', compareLoaderOptions);
});
