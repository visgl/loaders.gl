// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {validateTileGrid} from './tile-grid';
import type {TileSourceMetadata} from './tile-source';

/** Standard identifiers for the same Web Mercator CRS returned by tile services. */
const WEB_MERCATOR_COORDINATE_REFERENCE_SYSTEMS = new Set([
  'EPSG:3857',
  'urn:ogc:def:crs:EPSG::3857',
  'urn:x-ogc:def:crs:EPSG::3857',
  'http://www.opengis.net/def/crs/EPSG/0/3857',
  'https://www.opengis.net/def/crs/EPSG/0/3857'
]);

/** Options supported by the default deck.gl XYZ selector. */
export type XYZTileGridOptions = {
  /** Minimum native zoom. */
  minZoom: number;
  /** Maximum native zoom. */
  maxZoom: number;
  /** Logical square tile size. */
  tileSize: number;
};

/** Assessment of whether advertised metadata establishes canonical XYZ geometry. */
export type XYZTileGridAssessment = {
  /** `unknown` retains legacy defaults when complete geometry has not been advertised. */
  status: 'compatible' | 'unknown';
  /** Logical tile size and zoom range for the default XYZ selection. */
  options: XYZTileGridOptions;
};

/** Validates grid metadata and returns canonical XYZ options, or throws for incompatible geometry. */
export function getXYZTileGridOptions(metadata?: TileSourceMetadata | null): XYZTileGridAssessment {
  const options = {
    minZoom: metadata?.minZoom ?? 0,
    maxZoom: metadata?.maxZoom ?? 30,
    tileSize: 256
  };
  if (metadata?.tileGrid) validateTileGrid(metadata.tileGrid);
  const set = metadata?.tileGrid?.tileMatrixSet;
  if (!set) {
    if (metadata?.tileGrid?.matrices?.some(matrix => matrix.variableMatrixWidths?.length)) {
      throw new Error('Default XYZ selection requires a custom tile selector for coalesced rows.');
    }
    return {status: 'unknown', options};
  }
  if (!WEB_MERCATOR_COORDINATE_REFERENCE_SYSTEMS.has(set.crs) || !set.matrices.length)
    throw new Error(
      'Default XYZ selection requires canonical Web Mercator XYZ geometry; use a custom tile selector and compatible projection.'
    );
  let previousZoom: number | undefined;
  for (const matrix of set.matrices) {
    const zoom = Math.log2(matrix.matrixSize[0]);
    const size = matrix.tileSize[0];
    const halfWorld = 20037508.342789244;
    if (
      Boolean(matrix.variableMatrixWidths?.length) ||
      !Number.isInteger(zoom) ||
      zoom < 0 ||
      zoom > 31 ||
      matrix.id !== String(zoom) ||
      matrix.matrixSize[1] !== matrix.matrixSize[0] ||
      matrix.cornerOfOrigin !== 'topLeft' ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size !== matrix.tileSize[1] ||
      (previousZoom !== undefined && (zoom !== previousZoom + 1 || size !== options.tileSize)) ||
      !isClose(matrix.origin[0], -halfWorld) ||
      !isClose(matrix.origin[1], halfWorld) ||
      !isClose(matrix.resolution, (halfWorld * 2) / (size * 2 ** zoom)) ||
      !isClose(matrix.resolutionY ?? matrix.resolution, matrix.resolution)
    ) {
      throw new Error(
        'Default XYZ selection requires contiguous canonical XYZ levels; use a custom tile selector for this grid.'
      );
    }
    if (previousZoom === undefined) options.minZoom = zoom;
    options.maxZoom = zoom;
    options.tileSize = size;
    previousZoom = zoom;
  }
  return {status: 'compatible', options};
}

/** Compares canonical coordinates with a small relative serialization tolerance. */
function isClose(actual: number, expected: number): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= Math.abs(expected) * 1e-10;
}
