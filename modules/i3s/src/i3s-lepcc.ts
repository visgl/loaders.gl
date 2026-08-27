// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LepccDecoder, type LepccDecoderOptions, type LepccBlobType} from '@bitruvius/turbo-lepcc';

/** Attribute kinds encoded by an I3S LEPCC resource. */
export type I3SLEPCCBlobType = 'xyz' | 'rgb' | 'intensity' | 'flagBytes';

/** Values returned by an I3S LEPCC decode operation. */
export type I3SLEPCCDecodedValue = Float64Array | Uint8Array | Uint16Array;

/** Options passed to the underlying LEPCC WebAssembly decoder. */
export type I3SLEPCCDecoderOptions = LepccDecoderOptions;

/**
 * Decodes the standalone LEPCC attribute blobs used by I3S Point Cloud layers.
 *
 * I3S stores positions and each point attribute in separate self-describing
 * resources. This adapter keeps the third-party WebAssembly implementation
 * behind a loaders.gl-owned seam and normalizes its blob type names.
 */
export class I3SLEPCCDecoder {
  /** Underlying LEPCC decoder implementation. */
  readonly decoder: LepccDecoder;

  /**
   * @param options - Optional WebAssembly source override.
   */
  constructor(options?: I3SLEPCCDecoderOptions) {
    this.decoder = new LepccDecoder(options);
  }

  /**
   * Identifies the attribute represented by a LEPCC blob.
   *
   * @param bytes - One standalone I3S LEPCC resource.
   * @returns The normalized I3S attribute type.
   */
  async getBlobType(bytes: Uint8Array): Promise<I3SLEPCCBlobType> {
    return normalizeBlobType(await this.decoder.blobType(bytes));
  }

  /**
   * Decodes an I3S LEPCC position resource.
   *
   * @param bytes - A `lepcc-xyz` resource.
   * @returns Interleaved longitude, latitude, and elevation values.
   */
  async decodeXyz(bytes: Uint8Array): Promise<Float64Array> {
    return await this.decoder.decodeXyz(bytes);
  }

  /**
   * Decodes an I3S LEPCC RGB resource.
   *
   * @param bytes - A `lepcc-rgb` resource.
   * @returns Interleaved 8-bit red, green, and blue values.
   */
  async decodeRgb(bytes: Uint8Array): Promise<Uint8Array> {
    return await this.decoder.decodeRgb(bytes);
  }

  /**
   * Decodes an I3S LEPCC intensity resource.
   *
   * @param bytes - A `lepcc-intensity` resource.
   * @returns One unsigned 16-bit intensity value per point.
   */
  async decodeIntensity(bytes: Uint8Array): Promise<Uint16Array> {
    return await this.decoder.decodeIntensity(bytes);
  }

  /**
   * Decodes an I3S LEPCC packed LAS flags resource.
   *
   * @param bytes - A LEPCC flag-bytes resource.
   * @returns One packed flag byte per point.
   */
  async decodeFlagBytes(bytes: Uint8Array): Promise<Uint8Array> {
    return await this.decoder.decodeFlagBytes(bytes);
  }

  /**
   * Decodes a blob using its self-described attribute type.
   *
   * @param bytes - One standalone I3S LEPCC resource.
   * @returns The typed decoded values.
   */
  async decode(bytes: Uint8Array): Promise<I3SLEPCCDecodedValue> {
    const blobType = await this.getBlobType(bytes);
    switch (blobType) {
      case 'xyz':
        return await this.decodeXyz(bytes);
      case 'rgb':
        return await this.decodeRgb(bytes);
      case 'intensity':
        return await this.decodeIntensity(bytes);
      case 'flagBytes':
        return await this.decodeFlagBytes(bytes);
      default:
        return assertNever(blobType);
    }
  }
}

function normalizeBlobType(blobType: LepccBlobType): I3SLEPCCBlobType {
  switch (blobType.toLowerCase()) {
    case 'xyz':
      return 'xyz';
    case 'rgb':
      return 'rgb';
    case 'intensity':
      return 'intensity';
    case 'flagbytes':
    case 'flags':
      return 'flagBytes';
    default:
      throw new Error(`Unsupported I3S LEPCC blob type: ${blobType}`);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported I3S LEPCC blob type: ${String(value)}`);
}
