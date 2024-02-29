// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderOptions} from '@loaders.gl/loader-utils';
import type {TileJSON} from '@loaders.gl/mvt';
import {TileJSONLoader} from '@loaders.gl/mvt';
// import {Source, PMTiles, Header, TileType} from 'pmtiles';
import * as pmtiles from 'pmtiles';
const {TileType} = pmtiles;

/** Metadata describing a PMTiles file */
export type PMTilesMetadata = {
  format: 'pmtiles';
  /** Version of pm tiles format used by this tileset */
  formatVersion: number;

  /** MIME type for tile contents. Unknown tile types will return 'application/octet-stream */
  tileMIMEType:
    | 'application/vnd.mapbox-vector-tile'
    | 'image/png'
    | 'image/jpeg'
    | 'image/webp'
    | 'image/avif'
    | 'application/octet-stream';

  /** Name of the tileset (extracted from JSON metadata if available) */
  name?: string;
  /** Attribution string (extracted from JSON metadata if available) */
  attributions?: string[];

  /** Minimal zoom level of tiles in this tileset */
  minZoom: number;
  /** Maximal zoom level of tiles in this tileset */
  maxZoom: number;
  /** Bounding box of tiles in this tileset `[[w, s], [e, n]]`  */
  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Center long, lat of this tileset */
  center: [number, number];
  /** Center zoom level of this tileset */
  centerZoom: number;
  /** Cache tag */
  etag?: string;

  /** Parsed TileJSON/tilestats metadata, if present */
  tilejson?: TileJSON;

  /** @deprecated PMTiles format specific header */
  formatHeader?: pmtiles.Header;
  /** @deprecated Unparsed metadata (Assumption metadata generated by e.g. tippecanoe, typically TileJSON) */
  formatMetadata?: Record<string, unknown>;
};

/**
 * Parse PMTiles metdata from a PMTiles file
 * @param header
 * @param tilejsonMetadata
 * @param options
 * @param loadOptions
 * @returns
 */
export function parsePMTilesHeader(
  header: pmtiles.Header,
  pmmetadata: unknown,
  options?: {includeFormatHeader?: boolean},
  loadOptions?: LoaderOptions
): PMTilesMetadata {
  const pmtilesMetadata = pmmetadata as Record<string, unknown> | null;

  // Ironically, to use the TileJSON loader we need to stringify the metadata again.
  // This is the price of integrating with the existing pmtiles library.
  // TODO - provide a non-standard TileJSONLoader parsers that accepts a JSON object?
  let tilejson: TileJSON | null = null;
  if (pmtilesMetadata) {
    try {
      const string = JSON.stringify(pmtilesMetadata);
      tilejson = TileJSONLoader.parseTextSync?.(string, loadOptions) || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('PMTiles metadata could not be interpreted as TileJSON', error);
    }
  }

  const partialMetadata: Partial<PMTilesMetadata> = {};

  if (typeof tilejson?.name === 'string') {
    partialMetadata.name = tilejson.name;
  }

  if (typeof tilejson?.htmlAttribution === 'string') {
    partialMetadata.attributions = [tilejson.htmlAttribution];
  }

  const metadata: PMTilesMetadata = {
    ...partialMetadata,
    format: 'pmtiles',
    formatVersion: header.specVersion,
    attributions: [],
    tileMIMEType: decodeTileType(header.tileType),
    minZoom: header.minZoom,
    maxZoom: header.maxZoom,
    boundingBox: [
      [header.minLon, header.minLat],
      [header.maxLon, header.maxLat]
    ],
    center: [header.centerLon, header.centerLat],
    centerZoom: header.centerZoom,
    etag: header.etag
  };

  if (tilejson) {
    metadata.tilejson = tilejson;
  }

  // Application can optionally include the raw header and metadata.
  if (options?.includeFormatHeader) {
    metadata.formatHeader = header;
    metadata.formatMetadata = metadata;
  }

  return metadata;
}

/** Extract a MIME type for tiles from vector tile header  */
function decodeTileType(
  tileType: pmtiles.TileType
):
  | 'application/vnd.mapbox-vector-tile'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/avif'
  | 'application/octet-stream' {
  switch (tileType) {
    case TileType.Mvt:
      return 'application/vnd.mapbox-vector-tile';
    case TileType.Png:
      return 'image/png';
    case TileType.Jpeg:
      return 'image/jpeg';
    case TileType.Webp:
      return 'image/webp';
    case TileType.Avif:
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}
