// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoParseOptions} from './lib/draco-parser';
import type {DracoDecoderProfile} from './lib/draco-module-loader';

/** Draco decoder backend selected by the metadata loader. */
export type DracoDecoderBackend = 'wasm' | 'javascript' | 'draco3d';

/** Options for the Draco loader. */
export type DracoLoaderOptions = StrictLoaderOptions & {
  draco?: DracoParseOptions & {
    /** Decoder backend. Defaults to WASM when available and JavaScript otherwise. */
    backend?: DracoDecoderBackend | 'js';
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow-table';
    /** Selects the full decoder or the smaller glTF-compatible decoder build. */
    decoderProfile?: DracoDecoderProfile;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Default option bag for the Draco loader. */
export const DRACO_LOADER_DEFAULT_OPTIONS = {
  backend: typeof WebAssembly === 'object' ? 'wasm' : 'javascript',
  extraAttributes: {},
  attributeNameEntry: undefined,
  shape: 'arrow-table',
  decoderProfile: 'full'
} as const;
