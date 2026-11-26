// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {} from '@loaders.gl/core/loader-utils';

import type {Table as ArrowJSTable} from 'apache-arrow';
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {ColumnarTable, encodeArrowSync} from './lib/encoders/encode-arrow';
import {
  preloadArrowCompressionEncoder,
  type ArrowIPCCompression
} from './lib/parsers/arrow-compression';
import {ARROW_WRITER_METADATA} from './arrow-writer-types';

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
  ...ARROW_WRITER_METADATA,
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
} as const satisfies WriterWithEncoder<ColumnarTable | ArrowJSTable, never, ArrowWriterOptions>;
