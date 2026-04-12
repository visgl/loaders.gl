import {expect, test} from 'vitest';
import {
  getGlobalLoaderOptions,
  normalizeLoaderOptions,
  setGlobalOptions
} from '@loaders.gl/core/lib/loader-utils/option-utils';
test('coreOptions#deprecatedTopLevelMovesIntoCore', () => {
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
  expect(normalizedOptions.core.worker).toBe(false);
  expect(normalizedOptions.core._nodeWorkers).toBe(true);
  expect(normalizedOptions.core._workerType).toBe('test');
  expect((normalizedOptions as any)._worker).toBe(undefined);
  expect(normalizedOptions.core.batchSize).toBe(7);
  expect(normalizedOptions.core.batchDebounceMs).toBe(3);
  expect(normalizedOptions.core.limit).toBe(11);
  expect(normalizedOptions.core.metadata).toBe(true);
  expect((normalizedOptions as any).worker).toBe(undefined);
  expect((normalizedOptions as any).batchSize).toBe(undefined);
  setGlobalOptions({core: {worker: true}, worker: false});
  const globalOptions = getGlobalLoaderOptions();
  expect(globalOptions.core.worker).toBe(true);
  expect((globalOptions as any).worker).toBe(undefined);
  setGlobalOptions(originalClone);
});
