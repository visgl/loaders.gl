// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {I3SLEPCCFormat} from './i3s-format';
import type {I3SLEPCCBlobType, I3SLEPCCDecodedValue} from './i3s-lepcc';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options accepted by the standalone I3S LEPCC loader. */
export type I3SLEPCCLoaderOptions = LoaderOptions & {
  'i3s-lepcc'?: {
    /** Verify Fletcher-32 checksums before decoding. Defaults to true. */
    verifyChecksum?: boolean;
  };
};

/** Result returned after decoding one standalone LEPCC resource. */
export type I3SLEPCCLoaderResult = {
  /** Attribute represented by the resource. */
  type: I3SLEPCCBlobType;
  /** Decoded typed values. */
  value: I3SLEPCCDecodedValue;
};

/** Metadata-only loader for standalone I3S LEPCC resources. */
export const I3SLEPCCLoader = {
  ...I3SLEPCCFormat,
  dataType: null as unknown as I3SLEPCCLoaderResult,
  batchType: null as never,
  version: VERSION,
  worker: true,
  options: {
    'i3s-lepcc': {
      verifyChecksum: true
    }
  },
  preload: async () => {
    const {I3SLEPCCLoaderWithParser} = await import('./i3s-lepcc-loader-with-parser');
    return I3SLEPCCLoaderWithParser;
  }
} as const satisfies Loader<I3SLEPCCLoaderResult, never, I3SLEPCCLoaderOptions>;
