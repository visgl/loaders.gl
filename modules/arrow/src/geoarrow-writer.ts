// import type {} from '@loaders.gl/loader-utils';

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {GeoJSONTable, BinaryGeometry} from '@loaders.gl/schema';
import {encodeGeoArrowSync} from './lib/encode-geoarrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type ArrowWriterOptions = WriterOptions & {
  arrow?: {};
};

/** Apache Arrow writer */
export const GeoArrowWriter: WriterWithEncoder<
  GeoJSONTable | BinaryGeometry,
  never,
  ArrowWriterOptions
> = {
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
  binary: true,
  options: {},
  encode: async function encodeArrow(data, options?): Promise<ArrayBuffer> {
    // @ts-expect-error
    return encodeGeoArrowSync(data);
  },
  encodeSync(data, options?) {
    // @ts-expect-error
    return encodeGeoArrowSync(data);
  }
};
