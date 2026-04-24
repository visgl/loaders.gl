// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {parseCompressedTexture} from './lib/parsers/parse-compressed-texture';
import {parseBasis} from './lib/parsers/parse-basis';
import {CompressedTextureWorkerLoader as CompressedTextureWorkerLoaderMetadata} from './compressed-texture-loader';
import {CompressedTextureLoader as CompressedTextureLoaderMetadata} from './compressed-texture-loader';

const {
  preload: _CompressedTextureWorkerLoaderPreload,
  ...CompressedTextureWorkerLoaderMetadataWithoutPreload
} = CompressedTextureWorkerLoaderMetadata;
const {preload: _CompressedTextureLoaderPreload, ...CompressedTextureLoaderMetadataWithoutPreload} =
  CompressedTextureLoaderMetadata;

/** Options for the CompressedTextureLoaderWithParser */
export type CompressedTextureLoaderOptions = StrictLoaderOptions & {
  'compressed-texture'?: {
    /** Whether to use Basis decoding */
    useBasis?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureWorkerLoaderWithParser = {
  ...CompressedTextureWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<any, never, CompressedTextureLoaderOptions>;

/**
 * Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureLoaderWithParser = {
  ...CompressedTextureLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: CompressedTextureLoaderOptions) => {
    options = {...options};
    if (options?.['compressed-texture']?.useBasis) {
      options.basis = {
        format: {
          alpha: 'BC3',
          noAlpha: 'BC1'
        },
        ...options.basis,
        containerFormat: 'ktx2',
        module: 'encoder'
      };
      const result = await parseBasis(arrayBuffer, options);
      return result[0];
    }
    return parseCompressedTexture(arrayBuffer);
  }
} as const satisfies LoaderWithParser<any, never, CompressedTextureLoaderOptions>;
