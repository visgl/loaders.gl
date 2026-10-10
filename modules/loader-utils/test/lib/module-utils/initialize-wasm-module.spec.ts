// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {initializeWasmModule} from '../../../src/lib/module-utils/initialize-wasm-module';

test.each(['throw', 'reject', 'setup', 'callback'] as const)(
  'forwards an initialization %s failure with the original error',
  async (failureStage) => {
    const initializationError = new Error('WASM initialization failed');
    const extractExports = vi.fn(() => {
      if (failureStage === 'setup') {
        throw initializationError;
      }
      return {ready: true};
    });
    const result = initializeWasmModule((_onInitialized, onError) => {
      if (failureStage === 'throw') {
        throw initializationError;
      }
      if (failureStage === 'reject') {
        return Promise.reject(initializationError);
      }
      if (failureStage === 'callback') {
        onError(initializationError);
        return undefined;
      }
      return Promise.resolve({});
    }, extractExports);
    await expect(result).rejects.toBe(initializationError);
    expect(extractExports).toHaveBeenCalledTimes(failureStage === 'setup' ? 1 : 0);
  }
);

test('wraps callback-only Emscripten thenables without assimilating the raw module', async () => {
  const module = {
    then: vi.fn(() => {
      throw new Error('raw module assimilated');
    })
  };
  const result = await initializeWasmModule(
    (onInitialized) => {
      onInitialized(module);
    },
    (initializedModule) => ({module: initializedModule})
  );
  expect(result.module).toBe(module);
  expect(module.then).not.toHaveBeenCalled();
});

test('extracts exports once when both callback and promise report readiness', async () => {
  const module = {};
  const extractExports = vi.fn(() => ({ready: true}));
  await expect(
    initializeWasmModule((onInitialized) => {
      onInitialized(module);
      return Promise.resolve(module);
    }, extractExports)
  ).resolves.toEqual({ready: true});
  expect(extractExports).toHaveBeenCalledOnce();
});

test('an error callback prevents late module setup', async () => {
  const initializationError = new Error('initialization aborted');
  const extractExports = vi.fn(() => ({ready: true}));
  await expect(
    initializeWasmModule((onInitialized, onError) => {
      onError(initializationError);
      onInitialized({});
    }, extractExports)
  ).rejects.toBe(initializationError);
  expect(extractExports).not.toHaveBeenCalled();
});

test('handles a throwing then method', async () => {
  const initializationError = new Error('broken factory thenable');
  await expect(
    initializeWasmModule(
      () => ({
        then: () => {
          throw initializationError;
        }
      }),
      () => ({ready: true})
    )
  ).rejects.toBe(initializationError);
});

test('consumes a late factory rejection after its ready callback', async () => {
  const initializationError = new Error('late factory rejection');
  const extractExports = vi.fn(() => ({ready: true}));
  await expect(
    initializeWasmModule((onInitialized) => {
      onInitialized({});
      return Promise.reject(initializationError);
    }, extractExports)
  ).resolves.toEqual({ready: true});
  expect(extractExports).toHaveBeenCalledOnce();
});
