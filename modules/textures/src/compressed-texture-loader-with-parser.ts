// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {parseCompressedTexture} from './lib/parsers/parse-compressed-texture';
import {parseBasis} from './lib/parsers/parse-basis';
import {isKTX, readKTX2Container} from './lib/parsers/parse-ktx';
import {CompressedTextureWorkerLoader as CompressedTextureWorkerLoaderMetadata} from './compressed-texture-loader';
import {CompressedTextureLoader as CompressedTextureLoaderMetadata} from './compressed-texture-loader';
import type {BasisLoaderOptions} from './basis-types';

const {
  preload: _CompressedTextureWorkerLoaderPreload,
  ...CompressedTextureWorkerLoaderMetadataWithoutPreload
} = CompressedTextureWorkerLoaderMetadata;
const {preload: _CompressedTextureLoaderPreload, ...CompressedTextureLoaderMetadataWithoutPreload} =
  CompressedTextureLoaderMetadata;

/** Options for the CompressedTextureLoaderWithParser */
export type CompressedTextureLoaderOptions = StrictLoaderOptions &
  Pick<BasisLoaderOptions, 'basis'> & {
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
    if (options?.['compressed-texture']?.useBasis || isKTX(arrayBuffer)) {
      const ktx2 = isKTX(arrayBuffer) ? readKTX2Container(arrayBuffer) : null;
      const shouldUseBasis = Boolean(
        options?.['compressed-texture']?.useBasis ||
          ktx2?.supercompressionScheme !== 0 ||
          ktx2?.vkFormat === 0
      );
      if (!shouldUseBasis) {
        return parseCompressedTexture(arrayBuffer);
      }
      options.basis = {
        ...options.basis,
        containerFormat: 'ktx2'
      };
      const result = await parseBasis(arrayBuffer, options);
      return result[0];
    }
    return parseCompressedTexture(arrayBuffer);
  }
} as const satisfies LoaderWithParser<any, never, CompressedTextureLoaderOptions>;
