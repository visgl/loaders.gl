// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Comma-Separated Values */
export const CSVFormat = {
  id: 'csv',
  module: 'csv',
  name: 'CSV',
  extensions: ['csv', 'tsv', 'dsv'],
  mimeTypes: ['text/csv', 'text/tab-separated-values', 'text/dsv'],
  category: 'table'
} as const satisfies Format;
