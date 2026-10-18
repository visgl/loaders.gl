// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {I3SLEPCCDecoder} from './i3s-lepcc';
import {
  I3SLEPCCLoader,
  type I3SLEPCCLoaderOptions,
  type I3SLEPCCLoaderResult
} from './i3s-lepcc-loader-types';

/** Parser-bearing worker-capable I3S LEPCC loader. */
export const I3SLEPCCLoaderWithParser = {
  ...I3SLEPCCLoader,
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: I3SLEPCCLoaderOptions
  ): Promise<I3SLEPCCLoaderResult> => {
    const decoder = new I3SLEPCCDecoder({
      verifyChecksum: options?.['i3s-lepcc']?.verifyChecksum
    });
    const bytes = new Uint8Array(arrayBuffer);
    return {
      type: decoder.getBlobType(bytes),
      value: decoder.decode(bytes)
    };
  }
} as const satisfies LoaderWithParser<I3SLEPCCLoaderResult, never, I3SLEPCCLoaderOptions>;
