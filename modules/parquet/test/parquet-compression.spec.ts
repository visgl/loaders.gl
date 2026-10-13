// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { ZstdCodec } from 'zstd-codec';
import { ZstdCompression } from '@loaders.gl/compression/zstd-compression';
import { SnappyJSCompressor } from '@loaders.gl/compression/snappy-compressor-snappyjs';
import { createParquetPageDecompressor, decompress } from '../src/parquetjs/compression';
test('Parquet compression#native streams avoid codec fallbacks', async () => {
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
            expect([...output], `${method} uses native decompression`).toEqual([...input]);
            expect(formats.at(-1), `${method} maps to ${format}`).toBe(format);
        }
    }
    finally {
        restoreZstd();
        restoreBrotli();
        restoreDecompressionStream();
    }
});
test('Parquet compression#default Brotli uses compress-utils rather than injected legacy modules', async () => {
    const {BrotliCompressUtilsCompressor} = await import('@loaders.gl/compression/brotli-compressor-compress-utils');
    const formats: string[] = [];
    const restoreNative = installMockDecompressionStream(formats, []);
    let legacyCalls = 0;
    const restoreBrotli = replaceRegisteredModule('brotli', {decompress: () => {legacyCalls++;}});
    const input = new TextEncoder().encode('default brotli codec');
    try {
        const encoded = await new BrotliCompressUtilsCompressor().compress(input.buffer);
        expect(await decompress('BROTLI', new Uint8Array(encoded), input.length)).toEqual(input);
        expect(legacyCalls).toBe(0);
    } finally {
        restoreBrotli();
        restoreNative();
    }
});
test('Parquet compression#unsupported native gzip lazily falls back to fflate', async () => {
    const formats: string[] = [];
    const restoreDecompressionStream = installMockDecompressionStream(formats, []);
    const compressedGzip = new Uint8Array([
        31, 139, 8, 0, 0, 0, 0, 0, 0, 19, 99, 100, 98, 102, 97, 101, 99, 231, 224, 4, 0, 158, 171,
        239, 64, 9, 0, 0, 0
    ]);
    try {
        const output = await decompress('GZIP', compressedGzip, 9);
        expect([...output], 'compress-utils fallback decompresses').toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(formats, 'native gzip is probed before lazy fallback').toEqual(['gzip']);
    }
    finally {
        restoreDecompressionStream();
    }
});
test('Parquet compression#Snappy uses the shared lazy decoder', async () => {
  const input = new TextEncoder().encode('Snappy compression for a Parquet page');
  const compressed = await new SnappyJSCompressor().compress(input.buffer);
  const decompressPage = createParquetPageDecompressor('SNAPPY');
  expect(await decompressPage(new Uint8Array(compressed), input.byteLength)).toEqual(input);
});
/**
 * Installs a pass-through DecompressionStream double and returns a restorer.
 *
 * @param formats Mutable list receiving requested formats.
 * @param supportedFormats Formats accepted by the mock constructor.
 * @returns Callback that restores the original global constructor.
 */
function installMockDecompressionStream(formats: string[], supportedFormats: string[]): () => void {
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
        }
        else {
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
    }
    else {
        registeredModules[moduleName] = module;
    }
    return () => {
        if (hadModule) {
            registeredModules[moduleName] = originalModule;
        }
        else {
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
    return new Uint8Array(bufferSource.buffer, bufferSource.byteOffset, bufferSource.byteLength).slice();
}
