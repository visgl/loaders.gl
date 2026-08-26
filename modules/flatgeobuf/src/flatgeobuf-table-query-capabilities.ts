// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableQueryCapabilities} from '@loaders.gl/loader-utils';

/** Conservative capabilities of the current FlatGeobuf table-query adapter. */
export const FLATGEOBUF_TABLE_QUERY_CAPABILITIES: TableQueryCapabilities = Object.freeze({
  projection: 'residual',
  predicate: 'residual',
  limit: 'residual',
  streaming: true,
  cancellation: true
});
