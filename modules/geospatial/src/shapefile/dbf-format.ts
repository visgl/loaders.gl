// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Information about the DBF format */
export const DBFFormat = {
  name: 'DBF',
  id: 'dbf',
  module: 'geospatial',
  category: 'table',
  encoding: 'binary',
  format: 'dbf',
  extensions: ['dbf'],
  mimeTypes: ['application/x-dbf']
} as const satisfies Format;
