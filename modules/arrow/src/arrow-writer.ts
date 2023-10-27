// import type {} from '@loaders.gl/loader-utils';

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {ColumnarTable} from './lib/encode-arrow';
import {encodeArrowSync} from './lib/encode-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type ArrowWriterOptions = WriterOptions & {
  arrow?: {};
};

/** Apache Arrow writer */
export const ArrowWriter: Writer<ColumnarTable, never, ArrowWriterOptions> = {
  name: 'Apache Arrow',
  id: 'arrow',
  module: 'arrow',
  version: VERSION,
  extensions: ['arrow', 'feather'],
  mimeTypes: [
    'application/vnd.apache.arrow.file',
    'application/vnd.apache.arrow.stream',
    'application/octet-stream'
  ],
  encodeSync(data, options?) {
    return encodeArrowSync(data);
  },
  binary: true,
  options: {}
};
