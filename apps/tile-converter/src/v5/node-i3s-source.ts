// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {
  createSelectedI3SMeshConversionSource,
  inspectI3SMeshConversionSource,
  createTileConversionArchiveTransport,
  openTileConversionArchive
} from '@loaders.gl/tile-converter/v5/adapters';
import type {
  I3SMeshSelectionOptions,
  I3SMeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';
import {createTileConversionResourceFetcher} from './resource-fetcher.js';
import {NODE_TILESET_LIMITS, openLocalFile} from './node-source.js';
import type {NodeTilesetConversionSourceOptions} from './node-source.js';

/** Bounded I3S layer URL or indexed SLPK input with application-owned transport. */
export interface NodeI3SConversionSourceOptions
  extends Omit<NodeTilesetConversionSourceOptions, 'format' | 'inspectNestedTilesets'> {
  /** I3S HTTP(S) layer or local/HTTP(S) SLPK archive. */
  readonly format: 'i3s' | 'slpk';
}

/** Opens one lifetime-budgeted I3S source; its owner must close it in finally. */
export async function createNodeI3SConversionSource(options: NodeI3SConversionSourceOptions) {
  const maxInputBytes = options.maxInputBytes ?? NODE_TILESET_LIMITS.maxInputBytes;
  const maxInputResources = options.maxInputResources ?? NODE_TILESET_LIMITS.maxInputResources;
  if (
    !['i3s', 'slpk'].includes(options.format) ||
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes < 1 ||
    maxInputBytes > NODE_TILESET_LIMITS.maxInputBytes ||
    !Number.isSafeInteger(maxInputResources) ||
    maxInputResources < 1 ||
    maxInputResources > NODE_TILESET_LIMITS.maxInputResources
  )
    throw new TileConversionError(
      'INVALID_NODE_SOURCE_OPTIONS',
      'I3S sources require positive budgets within the bounded input profile'
    );
  const controller = new AbortController();
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;
  signal.throwIfAborted();
  let release: (() => Promise<void>) | undefined;
  let closePromise: Promise<void> | undefined;
  /** Cancels cached/runtime work and releases owned indexed readers exactly once. */
  const close = async (): Promise<void> => {
    controller.abort(new TileConversionError('NODE_SOURCE_CLOSED', 'Node source is closed'));
    closePromise ??= release?.() ?? Promise.resolve();
    await closePromise;
  };
  try {
    const remote = /^https?:/i.test(options.input);
    if (options.format === 'i3s' && !remote)
      throw new TileConversionError(
        'UNSUPPORTED_NODE_SOURCE',
        'I3S input requires an HTTP(S) layer URL; use slpk for a local archive'
      );
    let rootUrl: string;
    let transport: typeof fetch;
    if (options.format === 'slpk') {
      const archive = remote
        ? await openTileConversionArchive(
            {input: options.input, format: 'slpk'},
            maxInputBytes,
            signal,
            options.fetcher
          )
        : await createTileConversionArchiveTransport(
            await openLocalFile(
              await realpath(
                /^file:/i.test(options.input)
                  ? fileURLToPath(options.input)
                  : resolve(options.input)
              ),
              maxInputBytes,
              signal,
              () => {}
            ),
            'slpk',
            maxInputBytes,
            signal
          );
      release = archive.close;
      rootUrl = archive.rootUrl;
      transport = archive.fetcher;
    } else {
      rootUrl = new URL(options.input).href;
      transport = options.fetcher ?? fetch;
    }
    const bounded = createTileConversionResourceFetcher({
      maxInputBytes,
      signal,
      fetcher: transport
    });
    let metadataBytes = 0;
    const root = new URL(rootUrl);
    /** Inherits query credentials only within the selected layer's origin and path. */
    const fetcher: typeof fetch = async (input, requestOptions) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (
        url.origin === root.origin &&
        (url.pathname === root.pathname || url.pathname.startsWith(`${root.pathname}/`))
      )
        for (const [key, value] of root.searchParams)
          if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      const response = await bounded(
        input instanceof Request ? new Request(url, input) : url,
        requestOptions
      );
      if (response.url && response.url !== url.href)
        throw new TileConversionError(
          'I3S_REDIRECT_UNSUPPORTED',
          'Use the final I3S resource URL; redirected resource bases are not qualified'
        );
      const bytes = await response.arrayBuffer();
      metadataBytes += bytes.byteLength;
      const result = new Response(bytes, {status: response.status, headers: response.headers});
      Object.defineProperty(result, 'url', {value: response.url});
      return result;
    };
    // Metadata inspection needs no decoder transport initialization. Conversion injects bundled assets.
    const selectionOptions: I3SMeshSelectionOptions = {
      rootUrl,
      fetcher,
      signal,
      maxInputBytes,
      maxInputResources,
      dracoLibraryOptions: {decoderProfile: 'full' as const}
    };
    return {
      close,
      /** Reads only layer and node metadata, under the same lifetime-wide budget as conversion. */
      async inspect(operationSignal?: AbortSignal) {
        signal.throwIfAborted();
        operationSignal?.throwIfAborted();
        const activeSignal = operationSignal ? AbortSignal.any([signal, operationSignal]) : signal;
        /** Forwards borrowed operation cancellation without closing the owning source. */
        const operationFetcher: typeof fetch = (input, requestOptions) =>
          fetcher(input, {
            ...requestOptions,
            signal: requestOptions?.signal
              ? AbortSignal.any([activeSignal, requestOptions.signal])
              : activeSignal
          });
        const inspection = await inspectI3SMeshConversionSource({
          ...selectionOptions,
          fetcher: operationFetcher,
          signal: activeSignal
        });
        return {...inspection, metadataBytes};
      },
      /** Creates an original-coordinate selected mesh source using application-provided Draco assets. */
      select: (
        inspection: Awaited<ReturnType<typeof inspectI3SMeshConversionSource>>,
        resourceIds: readonly string[],
        dracoLibraryOptions: I3SMeshSelectionOptions['dracoLibraryOptions'],
        features?: I3SMeshSourceFeatureOptions
      ) => {
        signal.throwIfAborted();
        return createSelectedI3SMeshConversionSource(inspection, {
          ...selectionOptions,
          resourceIds,
          dracoLibraryOptions,
          features
        });
      }
    };
  } catch (error) {
    await close();
    throw error;
  }
}
