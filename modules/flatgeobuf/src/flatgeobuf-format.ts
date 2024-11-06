// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** flatgeobuf format */
export const FlatGeobufFormat = {
  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  module: 'flatgeobuf',
  extensions: ['fgb'],
  mimeTypes: ['application/octet-stream'],
  category: 'geometry'
} as const satisfies Format;
