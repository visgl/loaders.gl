// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Metadata describing the Delta Lake transaction-log format. */
export const DeltaFormat = {
  name: 'Delta Lake',
  id: 'delta',
  module: 'parquet',
  extensions: ['json', 'checkpoint.parquet'],
  mimeTypes: ['application/json']
};
