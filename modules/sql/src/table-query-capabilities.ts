// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableQueryCapabilities} from '@loaders.gl/loader-utils';

/** Portable query capabilities of the in-memory Arrow executor. */
export const ARROW_TABLE_QUERY_CAPABILITIES: TableQueryCapabilities = Object.freeze({
  projection: 'residual',
  predicate: 'residual',
  limit: 'residual',
  streaming: false,
  cancellation: true
});

/** Portable query capabilities shared by the current SQL data-source adapters. */
export const SQL_DATA_SOURCE_TABLE_QUERY_CAPABILITIES: TableQueryCapabilities = Object.freeze({
  projection: 'pushdown',
  predicate: 'pushdown',
  limit: 'pushdown',
  streaming: false,
  cancellation: false
});
