// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseCompressedTexture} from './lib/parsers/parse-compressed-texture';
import {parseBasis} from './lib/parsers/parse-basis';

/** Options for the CompressedTextureLoader */
export type CompressedTextureLoaderOptions = {
  'compressed-texture'?: {
    /** @deprecated Specify path to libraries */
    libraryPath?: string;
    /** Whether to use Basis decoding */
    useBasis?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureWorkerLoader = {
  dataType: null as unknown as any,
  batchType: null as never,

  name: 'Texture Containers',
  id: 'compressed-texture',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: [
    'ktx',
    'ktx2',
    'dds', // WEBGL_compressed_texture_s3tc, WEBGL_compressed_texture_atc
    'pvr' // WEBGL_compressed_texture_pvrtc
  ],
  mimeTypes: [
    'image/ktx2',
    'image/ktx',
    'image/vnd-ms.dds',
    'image/x-dds',
    'application/octet-stream'
  ],
  binary: true,
  options: {
    'compressed-texture': {
      libraryPath: 'libs/',
      useBasis: false
    }
  }
} as const satisfies Loader<any, never, CompressedTextureLoaderOptions>;

/**
 * Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: CompressedTextureLoaderOptions) => {
    if (options?.['compressed-texture']?.useBasis) {
      // @ts-expect-error TODO not allowed to modify inputs
      options.basis = {
        format: {
          alpha: 'BC3',
          noAlpha: 'BC1'
        },
        // @ts-expect-error TODO not allowed to modify inputs
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
