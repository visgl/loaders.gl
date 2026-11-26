// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {EncodeBSONOptions} from './lib/encoders/encode-bson';
import {encodeBSONSync} from './lib/encoders/encode-bson';
import {BSON_WRITER_METADATA} from './bson-writer-types';

/** Options for BSON document writing. */
export type BSONWriterOptions = WriterOptions & {
  /** Native BSON encoder options. */
  bson?: EncodeBSONOptions;
};

/** Native, dependency-free BSON document writer. */
export const BSONWriter = {
  ...BSON_WRITER_METADATA,
  /** Encodes one BSON document. */
  async encode(data: Record<string, unknown>, options?: BSONWriterOptions): Promise<ArrayBuffer> {
    return encodeBSONSync(data, options?.bson);
  },
  /** Encodes one BSON document synchronously. */
  encodeSync(data: Record<string, unknown>, options?: BSONWriterOptions): ArrayBuffer {
    return encodeBSONSync(data, options?.bson);
  }
} as const satisfies WriterWithEncoder<Record<string, unknown>, never, BSONWriterOptions>;
