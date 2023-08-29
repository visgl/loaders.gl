import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {FlatGeobufLoader as FlatGeobufWorkerLoader} from './flatgeobuf-loader';
import {parseFlatGeobuf, parseFlatGeobufInBatches} from './lib/parse-flatgeobuf';
import {FlatGeobufLoaderOptions} from './lib/types';

export {FlatGeobufWorkerLoader};

export const FlatGeobufLoader: LoaderWithParser<any, any, FlatGeobufLoaderOptions> = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer, options) => parseFlatGeobuf(arrayBuffer, options),
  parseSync: parseFlatGeobuf,
  // @ts-expect-error
  parseInBatchesFromStream: parseFlatGeobufInBatches,
  binary: true
};
