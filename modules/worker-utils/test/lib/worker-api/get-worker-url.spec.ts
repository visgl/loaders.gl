// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {NullWorker} from '@loaders.gl/worker-utils';
import type {WorkerObject} from '../../../src/types';
import {getWorkerURL} from '../../../src/lib/worker-api/get-worker-url';

test('getWorkerURL', t => {
  // TODO(ib): version injection issue in babel register
  // t.equals(
  //   getWorkerURL(NullWorker, {}),
  //   `https://unpkg.com/@loaders.gl/worker-utils@${VERSION}/dist/null-worker.js`,
  //   'worker url with no options'
  // );

  t.equals(
    getWorkerURL(NullWorker, {null: {workerUrl: 'custom-url'}}),
    'custom-url',
    'worker url with options.null.worker-url'
  );

  t.equals(
    getWorkerURL(NullWorker, {_workerType: 'test'}),
    isBrowser
      ? 'modules/worker-utils/dist/null-worker.js'
      : 'modules/worker-utils/src/workers/null-worker-node.ts',
    'worker url with _useLocalWorkers options'
  );

  t.end();
});

test('getWorkerURL#version fallback warning', t => {
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
    t.equals(
      latestWorkerUrl,
      `https://unpkg.com/@loaders.gl/worker-utils@latest/dist/${latestWorkerFile}`,
      'worker url falls back to npm tag'
    );
    t.equals(warnings.length, 1, 'emits one warning for latest worker fallback');
    t.ok(
      warnings[0].includes('Latest Test loader worker version is "latest"'),
      'warning identifies worker name'
    );
    t.ok(warnings[0].includes(latestWorkerUrl), 'warning includes worker URL');

    getWorkerURL(LatestWorker, {});
    t.equals(warnings.length, 1, 'deduplicates repeated warnings for the same worker');

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
    t.equals(warnings.length, 1, 'does not warn for explicit worker version');

    const CustomUrlWorker: WorkerObject = {
      ...LatestWorker,
      id: 'custom-url-test',
      name: 'Custom URL Test',
      options: {
        'custom-url-test': {}
      }
    };
    getWorkerURL(CustomUrlWorker, {'custom-url-test': {workerUrl: 'custom-url'}});
    t.equals(warnings.length, 1, 'does not warn for custom workerUrl');
  } finally {
    console.warn = originalConsoleWarn;
  }

  t.end();
});
