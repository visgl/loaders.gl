// SPDX-License-Identifier: MIT

// Dynamic DRACO module loading inspired by THREE.DRACOLoader
// https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/DRACOLoader.js
// by Don McCurdy / https://www.donmccurdy.com / MIT license

import {isBrowser, loadLibrary, type LoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {Draco3D} from '../draco3d/draco3d-types';

const DRACO_VERSION = '1.5.7';
const STATIC_DECODER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_VERSION}`;
const STATIC_ENCODER_URL = `https://unpkg.com/draco3d@${DRACO_VERSION}`;

/** External Draco runtime assets understood by `loadLibrary`. */
export const DRACO_EXTERNAL_LIBRARIES = {
  /** WebAssembly decoder JavaScript wrapper. */
  DECODER: 'draco_wasm_wrapper.js',
  /** WebAssembly decoder binary. */
  DECODER_WASM: 'draco_decoder.wasm',
  /** JavaScript decoder fallback. */
  FALLBACK_DECODER: 'draco_decoder.js',
  /** WebAssembly encoder JavaScript wrapper. */
  ENCODER: 'draco_encoder.js',
  /** WebAssembly encoder binary. */
  ENCODER_WASM: 'draco_encoder.wasm'
} as const;

/** Default versioned URLs for external Draco runtime assets. */
export const DRACO_EXTERNAL_LIBRARY_URLS = {
  [DRACO_EXTERNAL_LIBRARIES.DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.DECODER_WASM]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.DECODER_WASM}`,
  [DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.ENCODER]: `${STATIC_ENCODER_URL}/draco_encoder_nodejs.js`,
  [DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM]: `${STATIC_ENCODER_URL}/${DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM}`
} as const;

/** Initialized Draco module returned to the parser or builder. */
export type LoadedDracoModule = {draco: Draco3D};

/** Subset of the `draco3d` npm package accepted through `options.modules`. */
export type Draco3DModule = {
  /** Creates an initialized decoder module. */
  createDecoderModule?: (options?: Record<string, unknown>) => Promise<Draco3D>;
  /** Creates an initialized encoder module. */
  createEncoderModule?: (options?: Record<string, unknown>) => Promise<Draco3D>;
};

type DracoDecoderModule = Required<Pick<Draco3DModule, 'createDecoderModule'>>;
type DracoEncoderModule = Required<Pick<Draco3DModule, 'createEncoderModule'>>;

type DracoModuleInitializerOptions = {
  wasmBinary?: ArrayBuffer;
  onModuleLoaded?: (draco: Draco3D) => void;
};

type DracoModuleInitializer = (
  options: DracoModuleInitializerOptions
) => Promise<Draco3D> | undefined;

type DracoGlobal = typeof globalThis & {
  DracoDecoderModule?: DracoModuleInitializer;
  DracoEncoderModule?: DracoModuleInitializer;
};

const libraryDecoderPromises = new Map<string, Promise<LoadedDracoModule>>();
const libraryEncoderPromises = new Map<string, Promise<LoadedDracoModule>>();
const injectedDecoderPromises = new WeakMap<DracoDecoderModule, Promise<LoadedDracoModule>>();
const injectedEncoderPromises = new WeakMap<DracoEncoderModule, Promise<LoadedDracoModule>>();

/** Loads a Draco decoder from either an injected `draco3d` package or external libraries. */
export async function loadDracoDecoderModule(
  options: LoadLibraryOptions = {},
  type: 'wasm' | 'js'
): Promise<LoadedDracoModule> {
  const draco3DModule = getInjectedDraco3DModule(options);
  if (draco3DModule) {
    return await loadDracoDecoderModuleFromDraco3D(draco3DModule);
  }

  return await loadDracoDecoderModuleFromLibrary(options, type === 'js' ? 'javascript' : type);
}

/** Loads a Draco decoder from external WASM or JavaScript fallback libraries. */
export async function loadDracoDecoderModuleFromLibrary(
  options: LoadLibraryOptions = {},
  type: 'wasm' | 'javascript'
): Promise<LoadedDracoModule> {
  const cacheKey = getLibraryCacheKey(type, options);
  let decoderPromise = libraryDecoderPromises.get(cacheKey);
  if (!decoderPromise) {
    decoderPromise = loadDracoDecoderWithFallback(options, type);
    libraryDecoderPromises.set(cacheKey, decoderPromise);
  }
  return await decoderPromise;
}

/** Loads a decoder from an injected `draco3d` npm package. */
export async function loadDracoDecoderModuleFromDraco3D(
  draco3DModule: unknown
): Promise<LoadedDracoModule> {
  const typedDraco3DModule = validateDracoDecoderModule(draco3DModule);
  let decoderPromise = injectedDecoderPromises.get(typedDraco3DModule);
  if (!decoderPromise) {
    decoderPromise = typedDraco3DModule.createDecoderModule({}).then(draco => ({draco}));
    injectedDecoderPromises.set(typedDraco3DModule, decoderPromise);
  }
  return await decoderPromise;
}

/** Loads a Draco encoder from an injected `draco3d` package or external WASM libraries. */
export async function loadDracoEncoderModule(
  options: LoadLibraryOptions = {}
): Promise<LoadedDracoModule> {
  const draco3DModule = getInjectedDraco3DModule(options);
  if (draco3DModule) {
    const typedDraco3DModule = validateDracoEncoderModule(draco3DModule);
    let encoderPromise = injectedEncoderPromises.get(typedDraco3DModule);
    if (!encoderPromise) {
      encoderPromise = typedDraco3DModule.createEncoderModule({}).then(draco => ({draco}));
      injectedEncoderPromises.set(typedDraco3DModule, encoderPromise);
    }
    return await encoderPromise;
  }

  const cacheKey = getLibraryCacheKey('encoder', options);
  let encoderPromise = libraryEncoderPromises.get(cacheKey);
  if (!encoderPromise) {
    encoderPromise = loadDracoEncoder(options);
    libraryEncoderPromises.set(cacheKey, encoderPromise);
  }
  return await encoderPromise;
}

async function loadDracoDecoderWithFallback(
  options: LoadLibraryOptions,
  type: 'wasm' | 'javascript'
): Promise<LoadedDracoModule> {
  try {
    return await loadDracoDecoder(options, type);
  } catch (wasmError) {
    if (type === 'javascript') {
      throw wasmError;
    }
    try {
      return await loadDracoDecoder(options, 'javascript');
    } catch (javascriptError) {
      throw new AggregateError(
        [wasmError, javascriptError],
        'Draco decoder could not load either the WebAssembly or JavaScript backend'
      );
    }
  }
}

async function loadDracoDecoder(
  options: LoadLibraryOptions,
  type: 'wasm' | 'javascript'
): Promise<LoadedDracoModule> {
  if (type === 'javascript') {
    let decoderLibrary: unknown;
    try {
      decoderLibrary = await loadLibrary(
        DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER],
        'draco',
        options,
        DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER
      );
    } catch (error) {
      if (isBrowser || options.useLocalLibraries) {
        throw error;
      }
      decoderLibrary = await loadLibrary(
        DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER],
        'draco',
        {...options, useLocalLibraries: true},
        DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER
      );
    }
    const decoderInitializer =
      getLibraryExport(decoderLibrary, 'DracoDecoderModule') ||
      (globalThis as DracoGlobal).DracoDecoderModule;
    return await initializeDracoModule(decoderInitializer);
  }

  let decoderLibrary: unknown;
  let wasmBinary: ArrayBuffer;
  try {
    [decoderLibrary, wasmBinary] = await loadDecoderWasmAssets(options);
  } catch (error) {
    if (isBrowser || options.useLocalLibraries) {
      throw error;
    }
    [decoderLibrary, wasmBinary] = await loadDecoderWasmAssets({
      ...options,
      useLocalLibraries: true
    });
  }
  const decoderInitializer =
    getLibraryExport(decoderLibrary, 'DracoDecoderModule') ||
    (globalThis as DracoGlobal).DracoDecoderModule;
  return await initializeDracoModule(decoderInitializer, wasmBinary);
}

async function loadDecoderWasmAssets(options: LoadLibraryOptions): Promise<[unknown, ArrayBuffer]> {
  return await Promise.all([
    loadLibrary(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER],
      'draco',
      options,
      DRACO_EXTERNAL_LIBRARIES.DECODER
    ),
    loadLibrary(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER_WASM],
      'draco',
      options,
      DRACO_EXTERNAL_LIBRARIES.DECODER_WASM
    ) as Promise<ArrayBuffer>
  ]);
}

async function loadDracoEncoder(options: LoadLibraryOptions): Promise<LoadedDracoModule> {
  let encoderLibrary: unknown;
  let wasmBinary: ArrayBuffer;
  try {
    [encoderLibrary, wasmBinary] = await loadEncoderWasmAssets(options);
  } catch (error) {
    if (isBrowser || options.useLocalLibraries) {
      throw error;
    }
    [encoderLibrary, wasmBinary] = await loadEncoderWasmAssets({
      ...options,
      useLocalLibraries: true
    });
  }
  const encoderInitializer =
    getLibraryExport(encoderLibrary, 'DracoEncoderModule') ||
    (globalThis as DracoGlobal).DracoEncoderModule;
  return await initializeDracoModule(encoderInitializer, wasmBinary);
}

async function loadEncoderWasmAssets(options: LoadLibraryOptions): Promise<[unknown, ArrayBuffer]> {
  return await Promise.all([
    loadLibrary(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER],
      'draco',
      options,
      DRACO_EXTERNAL_LIBRARIES.ENCODER
    ),
    loadLibrary(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM],
      'draco',
      options,
      DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM
    ) as Promise<ArrayBuffer>
  ]);
}

function initializeDracoModule(
  initializer: DracoModuleInitializer | undefined,
  wasmBinary?: ArrayBuffer
): Promise<LoadedDracoModule> {
  if (typeof initializer !== 'function') {
    throw new Error('Draco module initializer could not be loaded');
  }

  return new Promise((resolve, reject) => {
    try {
      const modulePromise = initializer({
        ...(wasmBinary ? {wasmBinary} : {}),
        onModuleLoaded: draco => resolve({draco})
      });
      modulePromise?.then(draco => resolve({draco}), reject);
    } catch (error) {
      reject(error);
    }
  });
}

function getLibraryExport(
  library: unknown,
  exportName: 'DracoDecoderModule' | 'DracoEncoderModule'
): DracoModuleInitializer | undefined {
  if (typeof library === 'function') {
    return library as DracoModuleInitializer;
  }
  if (library && typeof library === 'object') {
    const exports = library as Record<string, unknown>;
    const exportedInitializer = exports[exportName] || exports.default;
    return typeof exportedInitializer === 'function'
      ? (exportedInitializer as DracoModuleInitializer)
      : undefined;
  }
  return undefined;
}

function getInjectedDraco3DModule(options: LoadLibraryOptions): Draco3DModule | undefined {
  const module = options.modules?.draco3d;
  if (!module) {
    return undefined;
  }
  if (typeof module !== 'object' && typeof module !== 'function') {
    throw new Error('Invalid draco3d module');
  }
  return module as Draco3DModule;
}

function validateDracoDecoderModule(module: unknown): DracoDecoderModule {
  const typedModule = module as Draco3DModule;
  if (typeof typedModule?.createDecoderModule !== 'function') {
    throw new Error('Invalid draco3d decoder module');
  }
  return typedModule as DracoDecoderModule;
}

function validateDracoEncoderModule(module: unknown): DracoEncoderModule {
  const typedModule = module as Draco3DModule;
  if (typeof typedModule?.createEncoderModule !== 'function') {
    throw new Error('Invalid draco3d encoder module');
  }
  return typedModule as DracoEncoderModule;
}

function getLibraryCacheKey(type: string, options: LoadLibraryOptions): string {
  const libraryOverrides = Object.entries(options.modules || {})
    .filter(([name]) => name !== 'draco3d')
    .map(([name, value]) => `${name}:${String(value)}`)
    .sort()
    .join('|');
  return [
    type,
    options.useLocalLibraries ? 'local' : 'remote',
    options.CDN || '',
    libraryOverrides
  ].join('|');
}
