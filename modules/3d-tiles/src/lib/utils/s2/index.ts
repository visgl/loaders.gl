// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

export {getS2CellIdFromToken, getS2TokenFromCellId, getS2ChildCellId} from './s2-token-functions';
export {getS2BoundaryFlat, getS2LngLat} from './s2-geometry-functions';

export {getS2Cell, getS2QuadKey} from './s2geometry/s2-cell-utils';
export {
  getS2QuadkeyFromCellId,
  getS2CellFromQuadKey,
  getS2CellIdFromQuadkey,
  getS2LngLatFromS2Cell
} from './s2geometry/s2-geometry';

export {getS2Region} from './converters/s2-to-region';

export type {S2HeightInfo} from './converters/s2-to-obb-points';
export {getS2OrientedBoundingBoxCornerPoints} from './converters/s2-to-obb-points';
