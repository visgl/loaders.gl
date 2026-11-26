// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Focused, renderer-independent grid normalization, validation and addressing utilities. */
export {
  createTileGrid,
  createTileGridMatrix,
  getRequestedTileMatrix,
  getTileGridMatrixId,
  getTileGridValidation,
  resolveTileGridTile,
  validateTileGrid,
  validateTileGridLimits
} from './lib/sources/tile-grid';
export type {
  TileGridValidation,
  TileGridValidationInput,
  TileGridValidationIssue,
  TileMatrixFields
} from './lib/sources/tile-grid';
export {getXYZTileGridOptions} from './lib/sources/xyz-grid-options';
export type {XYZTileGridAssessment, XYZTileGridOptions} from './lib/sources/xyz-grid-options';
