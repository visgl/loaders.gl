// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileConversionError} from './conversion-api.js';
import type {TileConversionSource} from './conversion-api.js';

/** Metadata available before a browser resource is read. */
export interface BrowserTileConversionInspection {
  /** Stable resource path assigned to the input tile. */
  readonly resourceId: string;
  /** Optional MIME type supplied by the caller or source Blob. */
  readonly contentType?: string;
}

/** Raw bytes read from one browser tile resource. */
export interface BrowserTileConversionInputResource {
  /** Stable resource path assigned to the input tile. */
  readonly resourceId: string;
  /** Complete resource bytes for a profile-specific codec. */
  readonly data: Uint8Array;
  /** Optional MIME type supplied by the caller, Blob, or URL response. */
  readonly contentType?: string;
}

/** Browser input and size limit for a single-resource conversion. */
export interface BrowserTileConversionSourceOptions {
  /** Input URL or already available browser Blob. */
  readonly input: string | Blob;
  /** Stable path to associate with the input resource. */
  readonly resourceId: string;
  /** Maximum number of input bytes held in memory. */
  readonly maxInputBytes: number;
  /** Optional MIME type override. */
  readonly contentType?: string;
}

/**
 * Creates a browser source for one mesh resource provided as a URL or Blob.
 *
 * URL responses are read incrementally and canceled if they exceed `maxInputBytes`.
 * Tileset JSON traversal and format decoding remain profile-specific source and codec work.
 *
 * @param options - Input, stable resource ID, and maximum input size.
 * @returns A source that yields one complete resource to a v5 codec.
 */
export function createBrowserTileConversionSource(
  options: BrowserTileConversionSourceOptions
): TileConversionSource<BrowserTileConversionInspection, BrowserTileConversionInputResource> {
  if (
    !options.resourceId ||
    !Number.isSafeInteger(options.maxInputBytes) ||
    options.maxInputBytes < 0
  ) {
    throw new TileConversionError(
      'INVALID_BROWSER_SOURCE_OPTIONS',
      'Browser sources require a resource ID and a non-negative safe input byte limit'
    );
  }

  return {
    async inspect(signal) {
      throwIfAborted(signal);
      const contentType = options.contentType ?? getBlobContentType(options.input);
      return {
        resourceId: options.resourceId,
        ...(contentType ? {contentType} : {})
      };
    },
    async *read(inspection, signal) {
      throwIfAborted(signal);
      const input = options.input;
      let data: Uint8Array;
      let contentType = inspection.contentType;

      if (typeof input === 'string') {
        const response = await fetch(input, {signal});
        if (!response.ok) {
          throw new TileConversionError(
            'BROWSER_SOURCE_FETCH_FAILED',
            `Could not fetch browser input (${response.status} ${response.statusText})`
          );
        }
        contentType = contentType ?? response.headers.get('content-type') ?? undefined;
        data = await readResponseBytes(response, options.maxInputBytes, signal);
      } else {
        if (input.size > options.maxInputBytes) {
          throw createInputLimitError(options.maxInputBytes);
        }
        data = new Uint8Array(await input.arrayBuffer());
      }

      throwIfAborted(signal);
      yield {
        resourceId: inspection.resourceId,
        data,
        ...(contentType ? {contentType} : {})
      };
    }
  };
}

/** Reads a response stream while enforcing the input byte limit. */
async function readResponseBytes(
  response: Response,
  maxInputBytes: number,
  signal?: AbortSignal
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new TileConversionError(
      'BROWSER_SOURCE_STREAM_UNAVAILABLE',
      'Browser URL inputs must provide a readable response stream'
    );
  }

  const data = new Uint8Array(maxInputBytes);
  let totalBytes = 0;
  try {
    while (true) {
      throwIfAborted(signal);
      const {done, value} = await reader.read();
      if (done) break;
      if (value.byteLength > maxInputBytes - totalBytes) {
        await reader.cancel();
        throw createInputLimitError(maxInputBytes);
      }
      data.set(value, totalBytes);
      totalBytes += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return data.subarray(0, totalBytes);
}

/** Returns a Blob's MIME type without requiring a same-realm Blob constructor. */
function getBlobContentType(input: string | Blob): string | undefined {
  return typeof input === 'string' ? undefined : input.type || undefined;
}

/** Creates the typed error used when browser input exceeds its configured limit. */
function createInputLimitError(maxInputBytes: number): TileConversionError {
  return new TileConversionError(
    'INPUT_RESOURCE_TOO_LARGE',
    `Browser input exceeds the configured ${maxInputBytes} byte memory limit`
  );
}

/** Throws the signal reason when a browser source operation has been canceled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
  }
}
