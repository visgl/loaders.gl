// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {} from '@loaders.gl/loader-utils';

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {ColumnarTable, encodeArrowSync} from './lib/encoders/encode-arrow';
import {
  preloadArrowCompressionEncoder,
  type ArrowIPCCompression
} from './lib/parsers/arrow-compression';
import {ArrowFormat} from './exports/arrow-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for Arrow IPC stream and file encoding. */
export type ArrowWriterOptions = WriterOptions & {
  arrow?: {
    /** Arrow IPC container. Feather V2 uses the `file` container. */
    container?: 'stream' | 'file';
    /** Optional embedded record-batch buffer compression. */
    compression?: ArrowIPCCompression | null;
  };
};

/** Apache Arrow writer */
export const ArrowWriter = {
  ...ArrowFormat,
  version: VERSION,
  options: {
    arrow: {
      container: 'stream',
      compression: null
    }
  },
  encode: async function encodeArrow(data, options?): Promise<ArrayBuffer> {
    const arrowOptions = options?.arrow;
    if (arrowOptions?.compression) {
      await preloadArrowCompressionEncoder(arrowOptions.compression, options?.modules);
    }
    return encodeArrowSync(data, arrowOptions);
  },
  encodeSync(data, options?) {
    return encodeArrowSync(data, options?.arrow);
  }
} as const satisfies WriterWithEncoder<ColumnarTable, never, ArrowWriterOptions>;
