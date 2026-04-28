// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {NullWorker} from '@loaders.gl/worker-utils';
import {
  getWorkerPoolName,
  getWorkerType,
  getWorkerURL
} from '../../../src/lib/worker-api/get-worker-url';

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

  const CombinedWorker = {
    ...NullWorker,
    workerFile: 'worker-utils-classic.js',
    workerModuleFile: 'worker-utils-module.js',
    workerNodeFile: 'worker-utils-classic-node.cjs'
  };

  t.equals(
    getWorkerURL(CombinedWorker, {_workerType: 'test'}),
    isBrowser
      ? 'modules/worker-utils/dist/worker-utils-classic.js'
      : 'modules/worker-utils/dist/worker-utils-classic-node.cjs',
    'combined classic worker url with _useLocalWorkers options'
  );

  t.equals(
    getWorkerURL(CombinedWorker, {_workerType: 'test', workerType: 'module'}),
    isBrowser
      ? 'modules/worker-utils/dist/worker-utils-module.js'
      : 'modules/worker-utils/dist/worker-utils-classic-node.cjs',
    'combined module worker url with _useLocalWorkers options'
  );

  t.equals(getWorkerType(CombinedWorker), 'classic', 'combined worker defaults to classic');

  t.equals(
    getWorkerType(CombinedWorker, {null: {workerUrl: 'custom-url'}}),
    'classic',
    'custom workerUrl defaults to classic worker type'
  );

  t.equals(
    getWorkerType(CombinedWorker, {null: {workerUrl: 'custom-url', workerType: 'module'}}),
    'module',
    'custom workerUrl can opt into module worker type'
  );

  t.equals(
    getWorkerPoolName(CombinedWorker),
    isBrowser
      ? 'worker-utils/worker-utils-classic.js'
      : 'worker-utils/worker-utils-classic-node.cjs',
    'combined worker pool name uses shared worker file'
  );

  t.equals(
    getWorkerPoolName(CombinedWorker, {workerType: 'module'}),
    isBrowser ? 'worker-utils/worker-utils-module.js' : 'worker-utils/worker-utils-classic-node.cjs',
    'combined module worker pool name uses shared worker file'
  );

  t.end();
});
