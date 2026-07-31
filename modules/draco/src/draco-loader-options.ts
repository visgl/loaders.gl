// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoParseOptions} from './lib/draco-parser';

/** Draco decoder backend selected by the metadata loader. */
export type DracoDecoderBackend = 'wasm' | 'javascript' | 'draco3d';

/** Options for the Draco loader. */
export type DracoLoaderOptions = StrictLoaderOptions & {
  draco?: DracoParseOptions & {
    /** Decoder backend. Defaults to WASM when available and JavaScript otherwise. */
    backend?: DracoDecoderBackend | 'js';
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow-table';
    /** @deprecated Use `backend: 'wasm'` or `backend: 'javascript'`. */
    decoderType?: 'wasm' | 'js';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Default option bag for the Draco loader. */
export const DRACO_LOADER_DEFAULT_OPTIONS = {
  backend: typeof WebAssembly === 'object' ? 'wasm' : 'javascript',
  decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js',
  extraAttributes: {},
  attributeNameEntry: undefined,
  shape: 'mesh'
} as const;
