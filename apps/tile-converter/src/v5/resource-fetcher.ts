// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileConversionError} from './conversion-api.js';

/** One aggregate transport budget shared by selected contents and their dependencies. */
export interface TileConversionResourceFetcherOptions {
  /** Maximum total response bytes, including previously inspected root bytes. */
  readonly maxInputBytes: number;
  /** Previously consumed input bytes, such as the inspected tileset JSON. */
  readonly initialInputBytes?: number;
  /** Application transport; also enables archive-backed or hermetic resolution. */
  readonly fetcher?: typeof fetch;
  /** Conversion cancellation, forwarded to every dependency request. */
  readonly signal?: AbortSignal;
}

/**
 * Wraps application fetch with a shared byte budget and conversion cancellation.
 * Each requested resource is charged, including repeated requests; HTTP(S), Blob and embedded data
 * URLs are accepted. Response streams are canceled on overflow or failure. The complete bounded
 * response is retained for codecs; this does not bound their decoded allocations.
 */
export function createTileConversionResourceFetcher(
  options: TileConversionResourceFetcherOptions
): typeof fetch {
  let consumed = options.initialInputBytes ?? 0;
  if (
    !Number.isSafeInteger(options.maxInputBytes) ||
    options.maxInputBytes < 1 ||
    !Number.isSafeInteger(consumed) ||
    consumed < 0 ||
    consumed > options.maxInputBytes
  )
    throw new TileConversionError(
      'INVALID_INPUT_MEMORY_LIMIT',
      'Resource fetch requires a positive aggregate byte budget and valid initial bytes'
    );
  const fetcher = options.fetcher ?? fetch;
  return async (input, requestOptions) => {
    options.signal?.throwIfAborted();
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (!['http:', 'https:', 'blob:', 'data:'].includes(url.protocol))
      throw new TileConversionError(
        'EXTERNAL_RESOURCE_UNSUPPORTED',
        'Conversion transport requires HTTP(S), Blob or embedded data resources'
      );
    const requestSignal =
      requestOptions?.signal ?? (input instanceof Request ? input.signal : undefined);
    const signal =
      options.signal && requestSignal
        ? AbortSignal.any([options.signal, requestSignal])
        : (options.signal ?? requestSignal);
    const response = await fetcher(input, {...requestOptions, signal});
    if (!response.ok) {
      await response.body?.cancel();
      throw new TileConversionError(
        'BROWSER_SOURCE_FETCH_FAILED',
        `Could not fetch conversion resource (${response.status})`
      );
    }
    const reader = response.body?.getReader();
    if (!reader)
      throw new TileConversionError(
        'BROWSER_SOURCE_STREAM_UNAVAILABLE',
        'Conversion resources require readable response streams'
      );
    /** Cancels an injected transport stream if it does not observe the request signal itself. */
    const cancelRead = () => {
      void reader.cancel(signal?.reason).catch(() => {});
    };
    signal?.addEventListener('abort', cancelRead, {once: true});
    const parts: Uint8Array[] = [];
    let byteLength = 0;
    try {
      while (true) {
        signal?.throwIfAborted();
        const {done, value} = await reader.read();
        signal?.throwIfAborted();
        if (done) break;
        if (value.byteLength > options.maxInputBytes - consumed)
          throw new TileConversionError(
            'INPUT_RESOURCE_TOO_LARGE',
            'Selected contents and external dependencies exceed the aggregate input byte budget'
          );
        consumed += value.byteLength;
        byteLength += value.byteLength;
        parts.push(value);
      }
    } catch (error) {
      await reader.cancel(error);
      throw error;
    } finally {
      signal?.removeEventListener('abort', cancelRead);
      reader.releaseLock();
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    const boundedResponse = new Response(bytes, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    // Relative dependencies must resolve against the final URL after redirects.
    Object.defineProperty(boundedResponse, 'url', {value: response.url});
    return boundedResponse;
  };
}
