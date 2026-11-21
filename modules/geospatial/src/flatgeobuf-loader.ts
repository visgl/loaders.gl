// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FlatGeobufLoader} from './flatgeobuf/flatgeobuf-loader-types.js';
import {
  FlatGeobufLoaderWithParser as parser,
  FlatGeobufWorkerLoaderWithParser as workerParser
} from './flatgeobuf/flatgeobuf-loader.js';

export * from './flatgeobuf/flatgeobuf-loader.js';

/** Parser-bearing FlatGeobuf loader with its browser module worker factory. */
export const FlatGeobufLoaderWithParser = {
  ...parser,
  loadWorker: FlatGeobufLoader.loadWorker
};

/** Public worker descriptor for FlatGeobuf, with the same local parser preload. */
export const FlatGeobufWorkerLoaderWithParser = {
  ...workerParser,
  loadWorker: FlatGeobufLoader.loadWorker,
  preload: FlatGeobufLoader.preload
};
