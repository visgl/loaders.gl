import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import {NullWorker} from '@loaders.gl/core/worker-utils';
import type {WorkerObject} from '../../../../src/worker-utils/types';
import {
  getCustomWorkerURL,
  getWorkerURL
} from '../../../../src/worker-utils/lib/worker-api/get-worker-url';
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
      ? 'modules/core/dist/worker-utils/null-worker.js'
      : 'modules/core/src/worker-utils/workers/null-worker-node.ts'
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
      ? 'modules/core/dist/worker-utils/null-worker.js'
      : 'modules/core/src/worker-utils/workers/null-worker-node.ts'
  );
  expect(
    getWorkerURL(
      {...NullWorker, id: 'wkb', module: 'wkt', workerFile: 'wkt-worker.js'},
      {_workerType: 'test'}
    ),
    'test worker URL supports a shared worker filename'
  ).toBe(
    isBrowser ? 'modules/wkt/dist/wkt-worker.js' : 'modules/wkt/src/workers/wkb-worker-node.ts'
  );
});
test('getWorkerURL#grouped Node test workers', () => {
  const i3sWorker = {
    ...NullWorker,
    id: 'i3s-content',
    module: 'tiles-3d',
    workerSourceNode: 'i3s/workers/i3s-content-worker-node.ts'
  };
  expect(getWorkerURL(i3sWorker, {_workerType: 'test'})).toBe(
    isBrowser
      ? 'modules/tiles-3d/dist/i3s-content-worker.js'
      : 'modules/tiles-3d/src/i3s/workers/i3s-content-worker-node.ts'
  );
  const mvtWorker = {
    ...NullWorker,
    id: 'mvt',
    module: 'tiles',
    workerSourceNode: 'mvt/workers/mvt-worker-node.ts'
  };
  expect(getWorkerURL(mvtWorker, {_workerType: 'test'})).toBe(
    isBrowser
      ? 'modules/tiles/dist/mvt-worker.js'
      : 'modules/tiles/src/mvt/workers/mvt-worker-node.ts'
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
      module: 'core',
      workerFile: 'worker-utils/latest-test-worker.js',
      workerNode: 'worker-utils/latest-test-worker-node.js',
      version: 'latest',
      worker: true,
      options: {
        'latest-test': {}
      }
    };
    const latestWorkerUrl = getWorkerURL(LatestWorker, {});
    const latestWorkerFile = isBrowser
      ? 'worker-utils/latest-test-worker.js'
      : 'worker-utils/latest-test-worker-node.js';
    expect(latestWorkerUrl, 'worker url falls back to npm tag').toBe(
      `https://unpkg.com/@loaders.gl/core@latest/dist/${latestWorkerFile}`
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
