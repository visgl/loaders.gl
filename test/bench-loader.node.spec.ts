// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {resolve as resolveBenchmarkSpecifier} from '../dev-modules/devtools-extensions/bench-loader.mjs';

test('bench-loader resolves workspace benchmark entries from test sources', async t => {
  const resolution = await resolveBenchmarkSpecifier(
    '@loaders.gl/json/test/json-loader.bench',
    {},
    () => {
      throw new Error('nextResolve should not be called for workspace benchmark entries');
    }
  );

  t.ok(
    resolution.url.endsWith('/modules/json/test/json-loader.bench.ts'),
    'benchmark entry resolves to test source'
  );
  t.ok(resolution.shortCircuit, 'benchmark entry short-circuits Node resolution');
  t.end();
});

test('bench-loader resolves workspace package roots from src', async t => {
  const resolution = await resolveBenchmarkSpecifier('@loaders.gl/json', {}, () => {
    throw new Error('nextResolve should not be called for workspace package roots');
  });

  t.ok(
    resolution.url.endsWith('/modules/json/src/index.ts'),
    'package root resolves to src/index.ts'
  );
  t.ok(resolution.shortCircuit, 'package root short-circuits Node resolution');
  t.end();
});

test('bench-loader delegates third-party resolution to Node', async t => {
  let nextResolveCalled = false;
  const delegatedResolution = {url: 'node:fs', shortCircuit: false};

  const resolution = await resolveBenchmarkSpecifier('node:fs', {}, async specifier => {
    nextResolveCalled = true;
    t.equal(specifier, 'node:fs', 'third-party specifier is delegated unchanged');
    return delegatedResolution;
  });

  t.ok(nextResolveCalled, 'third-party resolution is delegated');
  t.equal(resolution, delegatedResolution, 'delegate result is returned');
  t.end();
});
