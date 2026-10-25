// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {TarBuilder} from './tar-builder';
import {TarFormat} from './tar-format';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Named files to encode as an uncompressed TAR archive. */
export type TarWriterFiles = Readonly<Record<string, string | ArrayBuffer | Uint8Array>>;

/** Buffered TAR writer backed by the existing TAR builder. */
export const TarWriter = {
  ...TarFormat,
  version: VERSION,
  options: {},
  encode: async (files: TarWriterFiles, _options?: WriterOptions): Promise<ArrayBuffer> => {
    const builder = new TarBuilder();
    for (const [path, value] of Object.entries(files)) {
      const bytes =
        typeof value === 'string'
          ? new TextEncoder().encode(value)
          : value instanceof Uint8Array
            ? value
            : new Uint8Array(value);
      builder.addFile(path, bytes.slice().buffer);
    }
    return builder.build();
  }
} as const satisfies WriterWithEncoder<TarWriterFiles, never, WriterOptions>;
