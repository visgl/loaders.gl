// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** flatgeobuf format */
export const FlatGeobufFormat = {
  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  module: 'geospatial',
  encoding: 'flatbuffers',
  format: 'flatgeobuf',
  extensions: ['fgb'],
  mimeTypes: ['application/octet-stream'],
  category: 'geometry'
} as const satisfies Format;
