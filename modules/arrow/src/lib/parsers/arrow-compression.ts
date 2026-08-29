// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import lz4js from 'lz4js';
import {LZ4JSCompressor} from '@loaders.gl/compression/lz4-compressor-lz4js';
import {LZ4JSDecompressor} from '@loaders.gl/compression/lz4-decompressor-lz4js';
import {ZstdFzstdDecompressor} from '@loaders.gl/compression/zstd-decompressor-fzstd';
import {ZstdCompression} from '@loaders.gl/compression/zstd-compression';

/** Arrow IPC embedded buffer compression codecs. */
export type ArrowIPCCompression = 'lz4' | 'zstd';

type ArrowCompressionCodec = {
  encode?: (data: Uint8Array) => Uint8Array;
  decode?: (data: Uint8Array) => Uint8Array;
};

type ArrowCompressionRegistry = {
  get: (compressionType: number) => ArrowCompressionCodec | null;
  set: (compressionType: number, codec: ArrowCompressionCodec) => void;
};

type OptionalArrowCompressionAPI = {
  CompressionType?: {
    LZ4_FRAME?: number;
    ZSTD?: number;
  };
  compressionRegistry?: ArrowCompressionRegistry;
};

type SynchronousCompression = {
  compressSync?: (data: ArrayBuffer) => ArrayBuffer;
  decompressSync: (data: ArrayBuffer) => ArrayBuffer;
};

const lz4Compressor = new LZ4JSCompressor({modules: {lz4js}});
const lz4Decompressor = new LZ4JSDecompressor({modules: {lz4js}});
const zstdDecompressor = new ZstdFzstdDecompressor();
const zstdCompressor = new ZstdCompression();
let zstdCompressorReady = false;

const lz4Encoder = (data: Uint8Array): Uint8Array =>
  new Uint8Array(lz4Compressor.compressSync(data.slice().buffer as ArrayBuffer));
const zstdEncoder = (data: Uint8Array): Uint8Array =>
  new Uint8Array(zstdCompressor.compressSync(data.slice().buffer as ArrayBuffer));

/**
 * Registers loaders.gl codecs with Apache Arrow runtimes that support IPC body compression.
 *
 * Apache Arrow JS 21.2 added the optional compression registry. The feature check keeps this
 * module compatible with Apache Arrow JS 17, which remains supported for uncompressed IPC data.
 */
export function registerArrowCompressionCodecs(
  compressionAPI: OptionalArrowCompressionAPI = arrow as unknown as OptionalArrowCompressionAPI
): boolean {
  const registry = compressionAPI.compressionRegistry;
  const compressionTypes = compressionAPI.CompressionType;

  if (
    !registry ||
    typeof registry.get !== 'function' ||
    typeof registry.set !== 'function' ||
    typeof compressionTypes?.LZ4_FRAME !== 'number' ||
    typeof compressionTypes.ZSTD !== 'number'
  ) {
    return false;
  }

  registerArrowCompressionCodec(registry, compressionTypes.LZ4_FRAME, lz4Decompressor);
  registerArrowCompressionCodec(registry, compressionTypes.ZSTD, zstdDecompressor);
  return true;
}

/** Prepares an Arrow IPC compression encoder for use by the asynchronous writer. */
export async function preloadArrowCompressionEncoder(
  compression: ArrowIPCCompression,
  modules: Record<string, any> = {}
): Promise<void> {
  const registration = getArrowCompressionRegistration(compression);
  const registeredEncoder = registration.registry.get(registration.compressionType)?.encode;
  const encoder = compression === 'lz4' ? lz4Encoder : zstdEncoder;
  if (
    registeredEncoder &&
    (compression !== 'zstd' || registeredEncoder !== encoder || zstdCompressorReady)
  ) {
    return;
  }

  if (compression === 'zstd') {
    await zstdCompressor.preload(modules);
    zstdCompressorReady = true;
  }
  try {
    registerArrowCompressionEncoderSync(compression);
  } catch (error) {
    zstdCompressorReady = false;
    if (compression === 'zstd' && !modules['zstd-codec']) {
      throw new Error(
        "Arrow Zstandard encoding requires a 'zstd-codec' module in writer options.modules",
        {cause: error}
      );
    }
    throw error;
  }
}

/** Registers a synchronous Arrow IPC compression encoder and returns its Arrow enum value. */
export function registerArrowCompressionEncoderSync(compression: ArrowIPCCompression): number {
  const registration = getArrowCompressionRegistration(compression);
  const codec = registration.registry.get(registration.compressionType);
  const encoder = compression === 'lz4' ? lz4Encoder : zstdEncoder;
  if (
    codec?.encode &&
    (compression !== 'zstd' || codec.encode !== encoder || zstdCompressorReady)
  ) {
    return registration.compressionType;
  }
  if (compression === 'zstd' && !zstdCompressorReady) {
    throw new Error(
      'Synchronous Arrow Zstandard compression is not initialized; use encode() instead of encodeSync()'
    );
  }

  registration.registry.set(registration.compressionType, {
    ...(codec || {}),
    encode: encoder
  });
  return registration.compressionType;
}

/** Resolves the optional Arrow JS compression registry and enum for a requested codec. */
function getArrowCompressionRegistration(compression: ArrowIPCCompression): {
  registry: ArrowCompressionRegistry;
  compressionType: number;
} {
  const compressionAPI = arrow as unknown as OptionalArrowCompressionAPI;
  const registry = compressionAPI.compressionRegistry;
  const compressionTypes = compressionAPI.CompressionType;
  const compressionType =
    compression === 'lz4' ? compressionTypes?.LZ4_FRAME : compressionTypes?.ZSTD;

  if (
    !registry ||
    typeof registry.get !== 'function' ||
    typeof registry.set !== 'function' ||
    typeof compressionType !== 'number'
  ) {
    throw new Error(
      'Arrow IPC buffer compression requires apache-arrow 21.2.0 or later; the installed runtime only supports uncompressed IPC data'
    );
  }
  return {registry, compressionType};
}

/** Adds a decoder without replacing an application-provided codec or encoder. */
function registerArrowCompressionCodec(
  registry: ArrowCompressionRegistry,
  compressionType: number,
  decompressor: SynchronousCompression
): void {
  const codec = registry.get(compressionType);
  if (codec?.decode) {
    return;
  }

  registry.set(compressionType, {
    ...(codec || {}),
    decode: data => new Uint8Array(decompressor.decompressSync(data.slice().buffer as ArrayBuffer))
  });
}
