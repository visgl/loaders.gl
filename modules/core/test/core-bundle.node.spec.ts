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
