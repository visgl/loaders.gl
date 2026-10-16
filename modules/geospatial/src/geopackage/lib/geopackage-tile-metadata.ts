// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createTileGrid, createTileGridMatrix} from '@loaders.gl/loader-utils';
import type {TileGrid} from '@loaders.gl/loader-utils';
import type {Database} from 'sql.js';

/** Metadata for one GeoPackage raster tile table; tile payloads are not read. */
export type GeoPackageTileTableMetadata = {
  /** SQLite tile table name. */
  name: string;
  /** Human-readable identifier from gpkg_contents. */
  identifier?: string;
  /** Description from gpkg_contents. */
  description?: string;
  /** Local GeoPackage spatial reference key, not necessarily an EPSG code. */
  srsId: number;
  /** Authority-qualified CRS identifier when the spatial reference declares one. */
  crs?: string;
  /** Tile-matrix-set extent in native XY coordinates. */
  bounds: [[number, number], [number, number]];
  /** Normalized levels, including independent horizontal and vertical pixel sizes. */
  tileGrid: TileGrid;
};

/** Reads tile-table geometry without scanning tile payloads or inferring sparse availability. */
export function listGeoPackageTileTables(database: Database): GeoPackageTileTableMetadata[] {
  const tables = readRows(
    database,
    "SELECT * FROM gpkg_contents WHERE data_type = 'tiles' ORDER BY table_name"
  );
  return tables.map(table => {
    const name = String(table.table_name);
    const sets = readRows(
      database,
      `
      SELECT matrix_set.*, reference.srs_id AS reference_srs_id, reference.organization, reference.organization_coordsys_id
      FROM gpkg_tile_matrix_set AS matrix_set
      LEFT JOIN gpkg_spatial_ref_sys AS reference ON reference.srs_id = matrix_set.srs_id
      WHERE matrix_set.table_name = ?`,
      [name]
    );
    const matrixSet = sets[0];
    if (
      sets.length !== 1 ||
      !matrixSet ||
      matrixSet.srs_id !== table.srs_id ||
      !Number.isSafeInteger(matrixSet.srs_id) ||
      matrixSet.reference_srs_id !== matrixSet.srs_id
    ) {
      throw new Error(`Invalid GeoPackage tile matrix set for ${name}`);
    }
    const {min_x: minimumX, min_y: minimumY, max_x: maximumX, max_y: maximumY} = matrixSet;
    if (
      ![minimumX, minimumY, maximumX, maximumY].every(
        value => typeof value === 'number' && Number.isFinite(value)
      ) ||
      Number(minimumX) >= Number(maximumX) ||
      Number(minimumY) >= Number(maximumY)
    ) {
      throw new Error(`Invalid GeoPackage tile matrix bounds for ${name}`);
    }
    const organization = typeof matrixSet.organization === 'string' ? matrixSet.organization : '';
    const authorityCode = matrixSet.organization_coordsys_id;
    const crs =
      organization &&
      organization.toLowerCase() !== 'none' &&
      typeof authorityCode === 'number' &&
      Number.isSafeInteger(authorityCode) &&
      authorityCode >= 0
        ? `${organization.toUpperCase()}:${authorityCode}`
        : undefined;
    const rows = readRows(
      database,
      'SELECT * FROM gpkg_tile_matrix WHERE table_name = ? ORDER BY zoom_level',
      [name]
    );
    const identifiers = new Set<number>();
    const matrices = rows.map(row => {
      const level = row.zoom_level;
      if (
        typeof level !== 'number' ||
        !Number.isSafeInteger(level) ||
        level < 0 ||
        identifiers.has(level) ||
        ![row.matrix_width, row.matrix_height, row.tile_width, row.tile_height].every(
          value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
        ) ||
        ![row.pixel_x_size, row.pixel_y_size].every(
          value => typeof value === 'number' && Number.isFinite(value) && value > 0
        )
      ) {
        throw new Error(`Invalid GeoPackage tile matrix for ${name}`);
      }
      const width = Number(row.matrix_width) * Number(row.tile_width) * Number(row.pixel_x_size);
      const height = Number(row.matrix_height) * Number(row.tile_height) * Number(row.pixel_y_size);
      if (
        !matchesMatrixExtent(width, Number(minimumX), Number(maximumX)) ||
        !matchesMatrixExtent(height, Number(minimumY), Number(maximumY))
      ) {
        throw new Error(`GeoPackage tile matrix dimensions disagree with bounds for ${name}`);
      }
      identifiers.add(level);
      return createTileGridMatrix({
        id: String(level),
        resolution: Number(row.pixel_x_size),
        resolutionY: Number(row.pixel_y_size),
        point: [Number(minimumX), Number(maximumY)],
        swapAxes: false,
        tileWidth: Number(row.tile_width),
        tileHeight: Number(row.tile_height),
        matrixWidth: Number(row.matrix_width),
        matrixHeight: Number(row.matrix_height)
      });
    });
    return {
      name,
      identifier: typeof table.identifier === 'string' ? table.identifier : undefined,
      description: typeof table.description === 'string' ? table.description : undefined,
      srsId: Number(matrixSet.srs_id),
      crs,
      bounds: [
        [Number(minimumX), Number(minimumY)],
        [Number(maximumX), Number(maximumY)]
      ],
      tileGrid: createTileGrid(crs, matrices)
    };
  });
}

/** Executes a metadata-only query and releases its SQLite statement. */
function readRows(
  database: Database,
  query: string,
  parameters: string[] = []
): Record<string, unknown>[] {
  const statement = database.prepare(query);
  try {
    statement.bind(parameters);
    const rows: Record<string, unknown>[] = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

/** Compares declared and computed spans, allowing only floating-point roundoff. */
function matchesMatrixExtent(span: number, minimum: number, maximum: number): boolean {
  const declaredSpan = maximum - minimum;
  if (!Number.isFinite(span) || !Number.isFinite(declaredSpan)) return false;
  const tolerance =
    32 * Number.EPSILON * Math.max(Math.abs(minimum), Math.abs(maximum), span, declaredSpan);
  return Math.abs(span - declaredSpan) <= tolerance;
}
