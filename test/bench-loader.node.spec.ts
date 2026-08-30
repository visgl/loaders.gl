import {expect, test} from 'vitest';
import {resolve as resolveBenchmarkSpecifier} from './utils/bench-loader.mjs';
test('bench-loader resolves workspace benchmark entries from test sources', async () => {
  const resolution = await resolveBenchmarkSpecifier(
    '@loaders.gl/json/test/json-loader.bench',
    {},
    () => {
      throw new Error('nextResolve should not be called for workspace benchmark entries');
    }
  );
  expect(
    resolution.url.endsWith('/modules/json/test/json-loader.bench.ts'),
    'benchmark entry resolves to test source'
  ).toBeTruthy();
  expect(resolution.shortCircuit, 'benchmark entry short-circuits Node resolution').toBeTruthy();
});
test('bench-loader resolves workspace package roots from src', async () => {
  const resolution = await resolveBenchmarkSpecifier('@loaders.gl/json', {}, () => {
    throw new Error('nextResolve should not be called for workspace package roots');
  });
  expect(
    resolution.url.endsWith('/modules/json/src/index.ts'),
    'package root resolves to src/index.ts'
  ).toBeTruthy();
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
