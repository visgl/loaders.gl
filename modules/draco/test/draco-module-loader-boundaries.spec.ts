// SPDX-License-Identifier: MIT

import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import type {LoadLibraryOptions} from '../src/lib/draco-library-loader';
import {
  DRACO_EXTERNAL_LIBRARIES,
  loadDracoDecoderModule,
  loadDracoDecoderModuleFromDraco3D,
  loadDracoDecoderModuleFromLibrary,
  loadDracoEncoderModule
} from '../src/lib/draco-module-loader';

const loadLibraryMock = vi.hoisted(() =>
  vi.fn<typeof import('../src/lib/draco-library-loader').loadLibrary>()
);

vi.mock('../src/lib/draco-library-loader', () => ({
  // Exercise the local retry branch without loading Node-specific libraries in Chromium.
  isBrowser: false,
  loadLibrary: loadLibraryMock
}));

let configurationIndex = 0;

/** Isolates library-promise cache entries without resetting module-level state. */
function createOptions(overrides: LoadLibraryOptions = {}): LoadLibraryOptions {
  return {CDN: `fixture-${configurationIndex++}`, useLocalLibraries: true, ...overrides};
}

beforeEach(() => {
  loadLibraryMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

test.each([
  null,
  {},
  {createDecoderModule: 1}
])('rejects invalid injected decoder %j', async module => {
  await expect(loadDracoDecoderModuleFromDraco3D(module)).rejects.toThrow(
    'Invalid draco3d decoder module'
  );
  expect(loadLibraryMock).not.toHaveBeenCalled();
});

test.each([1, 'invalid', true])('rejects invalid injected package %j', async module => {
  await expect(loadDracoDecoderModule({modules: {draco3d: module}}, 'wasm')).rejects.toThrow(
    'Invalid draco3d module'
  );
  await expect(loadDracoEncoderModule({modules: {draco3d: module}})).rejects.toThrow(
    'Invalid draco3d module'
  );
});

test('injected factories are cached independently by identity and by encoder/decoder role', async () => {
  const decoder = {name: 'decoder'};
  const encoder = {name: 'encoder'};
  const module = {
    createDecoderModule: vi.fn(async () => decoder),
    createEncoderModule: vi.fn(async () => encoder)
  };
  const options = {modules: {draco3d: module}};
  const decoded = await Promise.all([
    loadDracoDecoderModule(options, 'wasm'),
    loadDracoDecoderModule(options, 'js', 'gltf')
  ]);
  expect(decoded[0]).toBe(decoded[1]);
  expect(decoded[0].draco).toBe(decoder);
  expect((await loadDracoEncoderModule(options)).draco).toBe(encoder);
  expect((await loadDracoEncoderModule(options)).draco).toBe(encoder);
  expect(module.createDecoderModule).toHaveBeenCalledExactlyOnceWith({});
  expect(module.createEncoderModule).toHaveBeenCalledExactlyOnceWith({});
  expect(loadLibraryMock).not.toHaveBeenCalled();
});

test('function-valued injected packages are accepted and missing encoder factories are rejected', async () => {
  const module = Object.assign(() => undefined, {
    createDecoderModule: async () => ({name: 'decoder'})
  });
  expect((await loadDracoDecoderModule({modules: {draco3d: module}}, 'js')).draco).toEqual({
    name: 'decoder'
  });
  await expect(loadDracoEncoderModule({modules: {draco3d: module}})).rejects.toThrow(
    'Invalid draco3d encoder module'
  );
});

test.each([
  'direct',
  'named',
  'default',
  'global'
] as const)('initializes a JavaScript decoder from a %s factory export', async exportType => {
  const decoder = {name: exportType};
  const initializer = vi.fn(async () => decoder);
  const library =
    exportType === 'direct'
      ? initializer
      : exportType === 'named'
        ? {DracoDecoderModule: initializer}
        : exportType === 'default'
          ? {default: initializer}
          : undefined;
  vi.stubGlobal('DracoDecoderModule', exportType === 'global' ? initializer : undefined);
  loadLibraryMock.mockResolvedValue(library);
  expect((await loadDracoDecoderModule(createOptions(), 'js')).draco).toBe(decoder);
  expect(initializer).toHaveBeenCalledWith({onModuleLoaded: expect.any(Function)});
  expect(loadLibraryMock.mock.calls[0][3]).toBe(DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER);
});

test('callback-only initialization resolves without requiring a returned promise', async () => {
  const decoder = {name: 'callback'};
  loadLibraryMock.mockResolvedValue({
    DracoDecoderModule: ({onModuleLoaded}: {onModuleLoaded: (value: unknown) => void}) => {
      onModuleLoaded(decoder);
    }
  });
  expect((await loadDracoDecoderModuleFromLibrary(createOptions(), 'javascript')).draco).toBe(
    decoder
  );
});

test.each([
  undefined,
  null,
  {},
  {default: 12},
  {DracoDecoderModule: 'invalid'}
])('missing factory export %j fails without hanging', async library => {
  vi.stubGlobal('DracoDecoderModule', undefined);
  loadLibraryMock.mockResolvedValue(library);
  await expect(loadDracoDecoderModuleFromLibrary(createOptions(), 'javascript')).rejects.toThrow(
    'initializer could not be loaded'
  );
});

test.each([
  'throw',
  'reject'
] as const)('propagates an initializer %s without retrying JavaScript', async mode => {
  const error = new Error(`initializer ${mode}`);
  loadLibraryMock.mockResolvedValue(() => {
    if (mode === 'throw') {
      throw error;
    }
    return Promise.reject(error);
  });
  await expect(loadDracoDecoderModuleFromLibrary(createOptions(), 'javascript')).rejects.toBe(
    error
  );
  expect(loadLibraryMock).toHaveBeenCalledTimes(1);
});

test.each([
  'full',
  'gltf'
] as const)('loads and caches the %s WASM profile with its binary', async profile => {
  const decoder = {name: profile};
  const binary = new ArrayBuffer(8);
  const initializer = vi.fn(async () => decoder);
  loadLibraryMock.mockImplementation(async (_url, _module, _options, library) =>
    library!.endsWith('.wasm') ? binary : {default: initializer}
  );
  const options = createOptions();
  const first = await loadDracoDecoderModuleFromLibrary(options, 'wasm', profile);
  const second = await loadDracoDecoderModuleFromLibrary(options, 'wasm', profile);
  expect(first).toBe(second);
  expect(first.draco).toBe(decoder);
  expect(initializer).toHaveBeenCalledExactlyOnceWith({
    wasmBinary: binary,
    onModuleLoaded: expect.any(Function)
  });
  expect(loadLibraryMock.mock.calls.map(call => call[3])).toEqual(
    profile === 'gltf'
      ? [DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER, DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER_WASM]
      : [DRACO_EXTERNAL_LIBRARIES.DECODER, DRACO_EXTERNAL_LIBRARIES.DECODER_WASM]
  );
});

test('a failed WASM initialization falls back to a full-profile JavaScript decoder', async () => {
  const decoder = {name: 'fallback'};
  const wasmFailure = new Error('WASM initialization failed');
  loadLibraryMock.mockImplementation(async (_url, _module, _options, library) => {
    if (library === DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER) {
      return {DracoDecoderModule: async () => decoder};
    }
    return library!.endsWith('.wasm') ? new ArrayBuffer(0) : () => Promise.reject(wasmFailure);
  });
  expect((await loadDracoDecoderModule(createOptions(), 'wasm', 'gltf')).draco).toBe(decoder);
  expect(loadLibraryMock.mock.calls.map(call => call[3])).toEqual([
    DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER,
    DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER_WASM,
    DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER
  ]);
});

test('both backend failures retain their original errors in an AggregateError', async () => {
  const wasmFailure = new Error('WASM fixture missing');
  const javascriptFailure = new Error('JavaScript fixture missing');
  loadLibraryMock.mockImplementation(async (_url, _module, _options, library) => {
    throw library === DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER ? javascriptFailure : wasmFailure;
  });
  const promise = loadDracoDecoderModule(createOptions(), 'wasm');
  await expect(promise).rejects.toBeInstanceOf(AggregateError);
  await expect(promise).rejects.toMatchObject({errors: [wasmFailure, javascriptFailure]});
});

test.each([
  'javascript',
  'wasm',
  'encoder'
] as const)('retries remote %s library failures using local assets', async backend => {
  const draco = {name: backend};
  loadLibraryMock.mockImplementation(async (_url, _module, options, library) => {
    if (!options!.useLocalLibraries) {
      throw new Error('remote fixture unavailable');
    }
    return library!.endsWith('.wasm') ? new ArrayBuffer(4) : () => Promise.resolve(draco);
  });
  const options = createOptions({useLocalLibraries: false});
  const output =
    backend === 'encoder'
      ? await loadDracoEncoderModule(options)
      : await loadDracoDecoderModuleFromLibrary(options, backend);
  expect(output.draco).toBe(draco);
  expect(loadLibraryMock.mock.calls.some(call => call[2]?.useLocalLibraries === false)).toBe(true);
  expect(loadLibraryMock.mock.calls.some(call => call[2]?.useLocalLibraries === true)).toBe(true);
  expect(options.useLocalLibraries).toBe(false);
});

test('local encoder loading does not retry a missing binary', async () => {
  const error = new Error('local binary missing');
  loadLibraryMock.mockRejectedValue(error);
  await expect(loadDracoEncoderModule(createOptions())).rejects.toBe(error);
  expect(loadLibraryMock).toHaveBeenCalledTimes(2);
});

test('encoder factories support globals and cache equivalent override configurations', async () => {
  const encoder = {name: 'encoder'};
  const initializer = vi.fn(async () => encoder);
  vi.stubGlobal('DracoEncoderModule', initializer);
  loadLibraryMock.mockResolvedValue(new ArrayBuffer(1));
  const options = createOptions({modules: {second: 'b', first: 'a', draco3d: null}});
  const first = await loadDracoEncoderModule(options);
  const second = await loadDracoEncoderModule({...options, modules: {first: 'a', second: 'b'}});
  expect(first).toBe(second);
  expect(first.draco).toBe(encoder);
  expect(loadLibraryMock).toHaveBeenCalledTimes(2);
  expect(initializer).toHaveBeenCalledTimes(1);
});

test('a rejected decoder leaves the initialization queue usable for a later configuration', async () => {
  loadLibraryMock.mockResolvedValue(() => Promise.reject(new Error('first factory failed')));
  await expect(loadDracoDecoderModuleFromLibrary(createOptions(), 'javascript')).rejects.toThrow(
    'first factory failed'
  );
  const decoder = {name: 'next factory'};
  loadLibraryMock.mockResolvedValue(() => Promise.resolve(decoder));
  expect((await loadDracoDecoderModuleFromLibrary(createOptions(), 'javascript')).draco).toBe(
    decoder
  );
});
