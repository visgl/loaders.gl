// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Format metadata for Apache ORC files. */
export const ORCFormat = {
  name: 'Apache ORC',
  id: 'orc',
  module: 'orc',
  extensions: ['orc'],
  mimeTypes: ['application/vnd.apache.orc', 'application/orc'],
  category: 'table',
  encoding: 'binary',
  format: 'orc',
  binary: true,
  tests: ['ORC']
} as const satisfies Format;
