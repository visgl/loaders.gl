// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';

/** Converts object rows into a native Arrow table, including empty results. */
export function convertRowsToArrowTable(rows: Record<string, unknown>[]): arrow.Table {
  return arrow.tableFromJSON(rows);
}
