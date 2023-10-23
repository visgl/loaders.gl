import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {FlatGeobufLoaderOptions} from './flatgeobuf-loader';
import {FlatGeobufLoader as FlatGeobufWorkerLoader} from './flatgeobuf-loader';
import {parseFlatGeobuf, parseFlatGeobufInBatches} from './lib/parse-flatgeobuf';

export {FlatGeobufWorkerLoader};

export const FlatGeobufLoader: LoaderWithParser<any, any, FlatGeobufLoaderOptions> = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer, options) => parseFlatGeobuf(arrayBuffer, options),
  parseSync: parseFlatGeobuf,
  // @ts-expect-error this is a stream parser not an async iterator parser
  parseInBatchesFromStream: parseFlatGeobufInBatches,
  binary: true
};
