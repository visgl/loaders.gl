import {expect, test} from 'vitest';
import {resolve as resolveBenchmarkSpecifier} from './utils/bench-loader.mjs';
test('bench-loader resolves workspace benchmark entries from test sources', async () => {
  const resolution = await resolveBenchmarkSpecifier(
    '@loaders.gl/tables/json/test/json-loader.bench',
    {},
    () => {
      throw new Error('nextResolve should not be called for workspace benchmark entries');
    }
  );
  expect(
    resolution.url.endsWith('/modules/tables/test/json/json-loader.bench.ts'),
    'benchmark entry resolves to test source'
  ).toBeTruthy();
  expect(resolution.shortCircuit, 'benchmark entry short-circuits Node resolution').toBeTruthy();
});
test('bench-loader resolves workspace package roots from src', async () => {
  const resolution = await resolveBenchmarkSpecifier('@loaders.gl/tables/json/index', {}, () => {
    throw new Error('nextResolve should not be called for workspace package roots');
  });
  expect(resolution.url).toContain('/modules/tables/src/json/index.ts');
  expect(resolution.shortCircuit, 'package root short-circuits Node resolution').toBeTruthy();
});
test('bench-loader delegates third-party resolution to Node', async () => {
  let nextResolveCalled = false;
  const delegatedResolution = {url: 'node:fs', shortCircuit: false};
  const resolution = await resolveBenchmarkSpecifier('node:fs', {}, async specifier => {
    nextResolveCalled = true;
    expect(specifier, 'third-party specifier is delegated unchanged').toBe('node:fs');
    return delegatedResolution;
  });
  expect(nextResolveCalled, 'third-party resolution is delegated').toBeTruthy();
  expect(resolution, 'delegate result is returned').toBe(delegatedResolution);
});
