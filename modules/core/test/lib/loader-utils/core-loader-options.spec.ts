// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {
  getGlobalLoaderOptions,
  normalizeLoaderOptions,
  setGlobalOptions
} from '@loaders.gl/core/lib/loader-utils/option-utils';

test('coreOptions#deprecatedTopLevelMovesIntoCore', (t) => {
  const originalGlobalOptions = getGlobalLoaderOptions();
  const originalClone = {...originalGlobalOptions, core: {...originalGlobalOptions.core}};

  const normalizedOptions = normalizeLoaderOptions({
    worker: false,
    _nodeWorkers: true,
    _workerType: 'test',
    _worker: 'should-not-override',
    batchSize: 7,
    batchDebounceMs: 3,
    limit: 11,
    metadata: true
  });

  t.equal(normalizedOptions.core.worker, false);
  t.equal(normalizedOptions.core._nodeWorkers, true);
  t.equal(normalizedOptions.core._workerType, 'test');
  t.equal((normalizedOptions as any)._worker, undefined);
  t.equal(normalizedOptions.core.batchSize, 7);
  t.equal(normalizedOptions.core.batchDebounceMs, 3);
  t.equal(normalizedOptions.core.limit, 11);
  t.equal(normalizedOptions.core.metadata, true);
  t.equal((normalizedOptions as any).worker, undefined);
  t.equal((normalizedOptions as any).batchSize, undefined);

  setGlobalOptions({core: {worker: true}, worker: false});
  const globalOptions = getGlobalLoaderOptions();
  t.equal(globalOptions.core.worker, true);
  t.equal((globalOptions as any).worker, undefined);

  setGlobalOptions(originalClone);
  t.end();
});
