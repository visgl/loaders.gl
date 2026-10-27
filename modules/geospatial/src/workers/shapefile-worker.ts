// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createLoaderWorker,
  createAuthenticatedFetch,
  type LoaderContext,
  type LoaderWithParser
} from '@loaders.gl/core/loader-utils';
import {ShapefileLoaderWithParser} from '../shapefile/shapefile-loader';

/** Installs local subloader parsing so streamed sidecars and geometry stay in this worker. */
function createShapefileContext(context?: LoaderContext, options?: any): LoaderContext {
  return {
    ...context,
    fetch: createAuthenticatedFetch({
      fetch: (url, init) => fetch(url as RequestInfo, init),
      credentials: options?.core?.credentials || [],
      fetchOptions:
        typeof (options?.core?.fetch ?? options?.fetch) === 'object'
          ? (options?.core?.fetch ?? options?.fetch)
          : undefined
    }),
    _parse: async (input: any, loader: LoaderWithParser, options: any) =>
      loader.parse!(
        input instanceof Response ? await input.arrayBuffer() : input,
        options,
        createShapefileContext(context, options)
      ),
    _parseInBatches: async (input: any, loader: LoaderWithParser, options: any) =>
      loader.parseInBatches!(
        input instanceof Response ? readResponse(input) : input,
        options,
        createShapefileContext(context, options)
      )
  } as LoaderContext;
}

/** Releases the streamed sidecar reader on completion, failure, or iterator cancellation. */
async function* readResponse(response: Response): AsyncIterable<Uint8Array> {
  const reader = response.body!.getReader();
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

/** Uses WKB columns for legacy output so feature construction runs only on the caller. */
function getArrowOptions(options: any): any {
  if ((options?.shapefile?.shape || 'arrow-table') === 'arrow-table') return options;
  return {
    ...options,
    geoarrow: {encodingPreference: 'geoarrow.wkb'},
    shapefile: {
      ...options?.shapefile,
      shape: 'arrow-table',
      geoarrowEncoding: 'geoarrow.wkb',
      geoarrow: {encodingPreference: 'geoarrow.wkb'}
    }
  };
}

createLoaderWorker({
  ...ShapefileLoaderWithParser,
  /** Parses geometries and sidecar attributes into owned transferable columns. */
  parse(input, options, context) {
    return ShapefileLoaderWithParser.parse(
      input,
      getArrowOptions(options),
      createShapefileContext(context, options)
    );
  },
  /** Joins streamed geometry and attribute batches without delegating their rows to the caller. */
  parseInBatches(input, options, context) {
    return ShapefileLoaderWithParser.parseInBatches(
      input,
      getArrowOptions(options),
      createShapefileContext(context, options)
    );
  }
});
