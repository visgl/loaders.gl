import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import {NullWorker} from '@loaders.gl/worker-utils';
import type {WorkerObject} from '../../../src/types';
import {getCustomWorkerURL, getWorkerURL} from '../../../src/lib/worker-api/get-worker-url';
test('getWorkerURL', () => {
  expect(
    getWorkerURL(NullWorker, {null: {workerUrl: 'custom-url'}}),
    'worker url with options.null.worker-url'
  ).toBe('custom-url');
  expect(
    getCustomWorkerURL(NullWorker, {null: {workerUrl: 'custom-url'}}),
    'custom worker URL omits the CDN fallback'
  ).toBe('custom-url');
  expect(
    getWorkerURL(NullWorker, {_workerType: 'test'}),
    'worker url with _useLocalWorkers options'
  ).toBe(
    isBrowser
      ? 'modules/worker-utils/dist/null-worker.js'
      : 'modules/worker-utils/src/workers/null-worker-node.ts'
  );
  expect(
    getWorkerURL(NullWorker, {
      null: {workerUrl: 'custom-url'},
      _workerType: 'test'
    }),
    'explicit worker URL precedes the test worker URL'
  ).toBe('custom-url');
  expect(getCustomWorkerURL(NullWorker, {}), 'no configured URL').toBeNull();
  expect(
    getCustomWorkerURL({...NullWorker, worker: 'descriptor-worker.js'}, {}),
    'descriptor fallback is not a configured URL'
  ).toBeNull();
  expect(
    getWorkerURL({...NullWorker, worker: 'descriptor-worker.js'}, {}),
    'descriptor URL is used as the classic fallback'
  ).toBe('descriptor-worker.js');
  expect(
    getWorkerURL({...NullWorker, worker: 'descriptor-worker.js'}, {_workerType: 'test'}),
    'test worker URL precedes a descriptor default'
  ).toBe(
    isBrowser
      ? 'modules/worker-utils/dist/null-worker.js'
      : 'modules/worker-utils/src/workers/null-worker-node.ts'
  );
});
test('getWorkerURL#version fallback warning', () => {
  const warnings: string[] = [];
  const originalConsoleWarn = console.warn;
  console.warn = (message?: any) => {
    warnings.push(String(message));
  };
  try {
    const LatestWorker: WorkerObject = {
      id: 'latest-test',
      name: 'Latest Test',
      module: 'worker-utils',
      version: 'latest',
      worker: true,
      options: {
        'latest-test': {}
      }
    };
    const latestWorkerUrl = getWorkerURL(LatestWorker, {});
    const latestWorkerFile = isBrowser ? 'latest-test-worker.js' : 'latest-test-worker-node.js';
    expect(latestWorkerUrl, 'worker url falls back to npm tag').toBe(
      `https://unpkg.com/@loaders.gl/worker-utils@latest/dist/${latestWorkerFile}`
    );
    expect(warnings.length, 'emits one warning for latest worker fallback').toBe(1);
    expect(
      warnings[0].includes('Latest Test loader worker version is "latest"'),
      'warning identifies worker name'
    ).toBeTruthy();
    expect(warnings[0].includes(latestWorkerUrl), 'warning includes worker URL').toBeTruthy();
    getWorkerURL(LatestWorker, {});
    expect(warnings.length, 'deduplicates repeated warnings for the same worker').toBe(1);
    const VersionedWorker: WorkerObject = {
      ...LatestWorker,
      id: 'versioned-test',
      name: 'Versioned Test',
      version: '1.2.3',
      options: {
        'versioned-test': {}
      }
    };
    getWorkerURL(VersionedWorker, {});
    expect(warnings.length, 'does not warn for explicit worker version').toBe(1);
    const CustomUrlWorker: WorkerObject = {
      ...LatestWorker,
      id: 'custom-url-test',
      name: 'Custom URL Test',
      options: {
        'custom-url-test': {}
      }
    };
    getWorkerURL(CustomUrlWorker, {'custom-url-test': {workerUrl: 'custom-url'}});
    expect(warnings.length, 'does not warn for custom workerUrl').toBe(1);
  } finally {
    console.warn = originalConsoleWarn;
  }
});
