// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {CompressedTextureFormat} from './texture-format';
import {VERSION} from './lib/utils/version';

/** Options for the CompressedTextureLoader */
export type CompressedTextureLoaderOptions = StrictLoaderOptions & {
  'compressed-texture'?: {
    /** Whether to use Basis decoding */
    useBasis?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing compressed texture loader implementation. */
async function preload() {
  const {CompressedTextureLoaderWithParser} = await import(
    './compressed-texture-loader-with-parser'
  );
  return CompressedTextureLoaderWithParser;
}

/** Metadata-only worker loader for KTX, DDS, and PVR texture container formats. */
export const CompressedTextureWorkerLoader = {
  ...CompressedTextureFormat,
  dataType: null as unknown as any,
  batchType: null as never,

  name: 'Texture Containers',
  id: 'compressed-texture',
  module: 'textures',
  version: VERSION,
  worker: true,
  encoding: 'image',
  format: 'compressed-texture',
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
      useBasis: false
    }
  },
  preload
} as const satisfies Loader<any, never, CompressedTextureLoaderOptions>;

/** Metadata-only loader for KTX, DDS, and PVR texture container formats. */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  preload
} as const satisfies Loader<any, never, CompressedTextureLoaderOptions>;
