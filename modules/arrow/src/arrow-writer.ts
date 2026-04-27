// import type {} from '@loaders.gl/loader-utils';

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {ColumnarTable, encodeArrowSync} from './lib/encoders/encode-arrow';
import {ArrowFormat} from './exports/arrow-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type ArrowWriterOptions = WriterOptions & {
  arrow?: {};
};

/** Apache Arrow writer */
export const ArrowWriter = {
  ...ArrowFormat,
  version: VERSION,
  options: {},
  encode: async function encodeArrow(data, options?): Promise<ArrayBuffer> {
    return encodeArrowSync(data);
  },
  encodeSync(data, options?) {
    return encodeArrowSync(data);
  }
} as const satisfies WriterWithEncoder<ColumnarTable, never, ArrowWriterOptions>;
