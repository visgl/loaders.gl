// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {TextureFormat, TextureLevel} from '@loaders.gl/schema';
import {parseBasis} from './lib/parsers/parse-basis';
import type {BasisFormat} from './lib/parsers/parse-basis';
import {BasisWorkerLoader as BasisWorkerLoaderMetadata} from './basis-loader';
import {BasisLoader as BasisLoaderMetadata} from './basis-loader';

const {preload: _BasisWorkerLoaderPreload, ...BasisWorkerLoaderMetadataWithoutPreload} =
  BasisWorkerLoaderMetadata;
const {preload: _BasisLoaderPreload, ...BasisLoaderMetadataWithoutPreload} = BasisLoaderMetadata;

type BasisFormatOption = BasisFormat | Uppercase<BasisFormat>;
type BasisTargetFormat =
  | 'auto'
  | BasisFormatOption
  | {
      alpha: BasisFormatOption;
      noAlpha: BasisFormatOption;
    };

/** Options for the BasisLoaderWithParser */
export type BasisLoaderOptions = LoaderOptions & {
  /** Options for the BasisLoaderWithParser */
  basis?: {
    /** Supported texture formats - app would typically query a WebGPU device or WebGL context to obtain the list of supported formats.*/
    supportedTextureFormats?: TextureFormat[];
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;

    /** What container format is used? */
    containerFormat?: 'auto' | 'ktx2' | 'basis';
    /** Format for texture data. auto selects based on platform caps (but gl context doesn't exist on a worker thread) */
    format?: BasisTargetFormat;
    /** What module to use for transcoding? */
    module?: 'transcoder' | 'encoder';
  };
};

/**
 * Worker loader for Basis super compressed textures
 */
export const BasisWorkerLoaderWithParser = {
  ...BasisWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<TextureLevel[][], never, BasisLoaderOptions>;

/**
 * Loader for Basis super compressed textures
 */
export const BasisLoaderWithParser = {
  ...BasisLoaderMetadataWithoutPreload,
  parse: parseBasis
} as const satisfies LoaderWithParser<TextureLevel[][], never, LoaderOptions>;
