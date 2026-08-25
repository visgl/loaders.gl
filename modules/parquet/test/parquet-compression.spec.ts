// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {ZstdCodec} from 'zstd-codec';
import {ZstdCompression} from '@loaders.gl/compression/zstd-compression';
import {decompress} from '../src/parquetjs/compression';

test('Parquet compression#native streams avoid codec fallbacks', async t => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream(formats, [
    'gzip',
    'brotli',
    'zstd'
  ]);
  const restoreBrotli = removeRegisteredModule('brotli');
  const restoreZstd = removeRegisteredModule('zstd-codec');
  const input = new Uint8Array([1, 2, 3, 4]);

  try {
    for (const [method, format] of [
      ['GZIP', 'gzip'],
      ['BROTLI', 'brotli'],
      ['ZSTD', 'zstd']
    ] as const) {
      const output = await decompress(method, input, input.byteLength);
      t.deepEqual([...output], [...input], `${method} uses native decompression`);
      t.equal(formats.at(-1), format, `${method} maps to ${format}`);
    }
  } finally {
    restoreZstd();
    restoreBrotli();
    restoreDecompressionStream();
  }

  t.end();
});

test('Parquet compression#provided modules bypass native streams', async t => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream(formats, ['brotli', 'zstd']);
  const input = new Uint8Array([1, 2, 3, 4]);
  const restoreBrotli = replaceRegisteredModule('brotli', {
    decompress: (bytes: Uint8Array) => bytes,
    compress: () => {
      throw new Error('compression is not used by this test');
    }
  });
  const restoreZstd = replaceRegisteredModule('zstd-codec', ZstdCodec);

  try {
    const brotliOutput = await decompress('BROTLI', input, input.byteLength);
    t.deepEqual([...brotliOutput], [...input], 'provided Brotli module decompresses data');

    const compression = new ZstdCompression({modules: {'zstd-codec': ZstdCodec}});
    await compression.preload();
    const compressedZstd = new Uint8Array(compression.compressSync(input.buffer));
    const zstdOutput = await decompress('ZSTD', compressedZstd, input.byteLength);
    t.deepEqual([...zstdOutput], [...input], 'provided zstd-codec decompresses data');
    t.deepEqual(formats, [], 'provided modules bypass native stream probing');
  } finally {
    restoreZstd();
    restoreBrotli();
    restoreDecompressionStream();
  }

  t.end();
});

test('Parquet compression#unsupported native gzip lazily falls back to fflate', async t => {
  const formats: string[] = [];
  const restoreDecompressionStream = installMockDecompressionStream(formats, []);
  const compressedGzip = new Uint8Array([
    31, 139, 8, 0, 0, 0, 0, 0, 0, 19, 99, 100, 98, 102, 97, 101, 99, 231, 224, 4, 0, 158, 171,
    239, 64, 9, 0, 0, 0
  ]);

  try {
    const output = await decompress('GZIP', compressedGzip, 9);
    t.deepEqual([...output], [1, 2, 3, 4, 5, 6, 7, 8, 9], 'fflate fallback decompresses');
    t.deepEqual(formats, ['gzip'], 'native gzip is probed before lazy fallback');
  } finally {
    restoreDecompressionStream();
  }

  t.end();
});

/**
 * Installs a pass-through DecompressionStream double and returns a restorer.
 *
 * @param formats Mutable list receiving requested formats.
 * @param supportedFormats Formats accepted by the mock constructor.
 * @returns Callback that restores the original global constructor.
 */
function installMockDecompressionStream(
  formats: string[],
  supportedFormats: string[]
): () => void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'DecompressionStream');

  class MockDecompressionStream {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<BufferSource>;

    /** Creates a pass-through stream for one supported format. */
    constructor(format: string) {
      formats.push(format);
      if (!supportedFormats.includes(format)) {
        throw new TypeError('mock compression format is unsupported');
      }
      const transformStream = new TransformStream<BufferSource, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(copyBufferSource(chunk));
        }
      });
      this.readable = transformStream.readable;
      this.writable = transformStream.writable;
    }
  }

  Object.defineProperty(globalThis, 'DecompressionStream', {
    configurable: true,
    writable: true,
    value: MockDecompressionStream
  });

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'DecompressionStream', originalDescriptor);
    } else {
      delete (globalThis as any).DecompressionStream;
    }
  };
}

/**
 * Removes one registered injectable module and returns a restorer.
 *
 * @param moduleName Registered module name.
 * @returns Callback that restores the original registration.
 */
function removeRegisteredModule(moduleName: string): () => void {
  return replaceRegisteredModule(moduleName, undefined);
}

/**
 * Replaces one registered injectable module and returns a restorer.
 *
 * @param moduleName Registered module name.
 * @param module Module value, or undefined to remove it.
 * @returns Callback that restores the original registration.
 */
function replaceRegisteredModule(moduleName: string, module: unknown): () => void {
  const globalWithLoaders = globalThis as any;
  globalWithLoaders.loaders ||= {};
  const loaders = globalWithLoaders.loaders;
  loaders.modules ||= {};
  const registeredModules = loaders.modules;
  const hadModule = Object.prototype.hasOwnProperty.call(registeredModules, moduleName);
  const originalModule = registeredModules[moduleName];
  if (module === undefined) {
    delete registeredModules[moduleName];
  } else {
    registeredModules[moduleName] = module;
  }

  return () => {
    if (hadModule) {
      registeredModules[moduleName] = originalModule;
    } else {
      delete registeredModules[moduleName];
    }
  };
}

/**
 * Copies a native stream input chunk into a Uint8Array.
 *
 * @param bufferSource Native stream input chunk.
 * @returns Copied bytes for the mock stream output.
 */
function copyBufferSource(bufferSource: BufferSource): Uint8Array {
  if (bufferSource instanceof ArrayBuffer) {
    return new Uint8Array(bufferSource).slice();
  }
  return new Uint8Array(
    bufferSource.buffer,
    bufferSource.byteOffset,
    bufferSource.byteLength
  ).slice();
}
