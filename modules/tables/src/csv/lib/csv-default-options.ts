// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Default output shape for CSV row-table parsing. */
export const DEFAULT_CSV_SHAPE = 'object-row-table' as const;

/** Default CSV parser options shared by row-table and Arrow-table code paths. */
export const DEFAULT_CSV_OPTIONS = {
  shape: DEFAULT_CSV_SHAPE,
  optimizeMemoryUsage: false,
  header: 'auto' as const,
  columnPrefix: 'column',
  quoteChar: '"',
  escapeChar: '"',
  dynamicTyping: true,
  comments: false,
  skipEmptyLines: true,
  detectGeometryColumns: false,
  delimitersToGuess: [',', '\t', '|', ';']
};
