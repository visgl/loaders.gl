// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {waitForPromiseWithSignal} from '@loaders.gl/loader-utils';
import type {PMTilesTile} from '@loaders.gl/pmtiles';

/** Small browser-demo budgets; these do not bound parser or encoder peak heap. */
export const PMTILES_EXAMPLE_LIMITS = {
  /** Local/vector input bytes or aggregate requested GeoTIFF range bytes. */
  inputBytes: 32 * 1024 * 1024,
  /** Complete archive bytes. */
  outputBytes: 32 * 1024 * 1024,
  /** Input table rows and per-tile features. */
  rows: 50000,
  /** All requested addresses, including empty tiles. */
  tiles: 64
} as const;

/** Input formats normalized by the example's existing loaders. */
export type PMTilesExampleFormat = 'geojson' | 'arrow' | 'geotiff';

/** A finite user-selected area at one zoom, with payload-specific column selection. */
export type PMTilesExampleOptions = {
  /** Explicit input format, independent of URL suffixes. */
  format: PMTilesExampleFormat;
  /** MVT/MLT for vectors, PNG for byte imagery. */
  tileType: 'mvt' | 'mlt' | 'png';
  /** Longitude/latitude west, south, east, north; no antimeridian crossing. */
  bounds: readonly number[];
  /** Single output zoom, integer 0–8. */
  zoom: number;
  /** Optional scalar attribute names; empty omits attributes. */
  attributes?: string[];
  /** Optional safe numeric feature ID column for vectors. */
  idColumn?: string;
  /** Optional zero-based raster bands in gray/gray-alpha/RGB/RGBA order. */
  bands?: number[];
};

/** Tiny offline sample; loading it never contacts a data service. */
export function createPMTilesSample(): Blob {
  return new Blob(
    [
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {name: 'West'},
            geometry: {type: 'Point', coordinates: [-90, 40]}
          },
          {
            type: 'Feature',
            properties: {name: 'East'},
            geometry: {type: 'Point', coordinates: [90, -40]}
          }
        ]
      })
    ],
    {type: 'application/geo+json'}
  );
}

/** Enumerates intersecting canonical XYZ addresses, checking the budget before allocation. */
export function selectPMTilesExampleTiles(
  bounds: readonly number[],
  zoom: number
): Pick<PMTilesTile, 'z' | 'x' | 'y'>[] {
  const [west, south, east, north] = bounds;
  const limit = 85.0511287798066;
  if (
    bounds.length !== 4 ||
    ![west, south, east, north].every(Number.isFinite) ||
    west < -180 ||
    east > 180 ||
    west >= east ||
    south < -limit ||
    north > limit ||
    south >= north
  )
    throw new Error(
      'Use ordered bounds within longitude ±180° and latitude ±85.0511°, without crossing the antimeridian.'
    );
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 8)
    throw new Error('Choose an integer zoom from 0 through 8.');
  const size = 2 ** zoom;
  /** Projects geographic latitude to north-origin Web Mercator tile space. */
  const projectLatitude = (latitude: number) =>
    Math.max(
      0,
      Math.min(1, (1 - Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) / Math.PI) / 2)
    ) * size;
  const minimumX = Math.max(0, Math.floor(((west + 180) / 360) * size));
  const maximumX = Math.min(size - 1, Math.ceil(((east + 180) / 360) * size) - 1);
  const minimumY = Math.max(0, Math.floor(projectLatitude(north)));
  const maximumY = Math.min(size - 1, Math.ceil(projectLatitude(south)) - 1);
  const count = (maximumX - minimumX + 1) * (maximumY - minimumY + 1);
  if (count < 1 || count > PMTILES_EXAMPLE_LIMITS.tiles)
    throw new Error('Select a smaller area or lower zoom (maximum 64 requested tiles).');
  const tiles: Pick<PMTilesTile, 'z' | 'x' | 'y'>[] = [];
  for (let y = minimumY; y <= maximumY; y++)
    for (let x = minimumX; x <= maximumX; x++) tiles.push({z: zoom, x, y});
  return tiles;
}

/** Reads a bounded input; remote streaming is stopped before accepting an oversized body. */
export async function readPMTilesExampleInput(
  input: Blob | string,
  signal: AbortSignal,
  maxBytes: number = PMTILES_EXAMPLE_LIMITS.inputBytes
): Promise<ArrayBuffer> {
  signal.throwIfAborted();
  if (input instanceof Blob) {
    if (input.size > maxBytes) throw new Error('Input exceeds the 32 MiB example limit.');
    return waitForPromiseWithSignal(input.arrayBuffer(), signal);
  }
  const url = getPMTilesExampleURL(input);
  const response = await fetch(url, {signal});
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Dataset request failed (${response.status}).`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Dataset response has no readable body.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    const declared = Number(response.headers.get('content-length'));
    if (declared > maxBytes) throw new Error('Input exceeds the 32 MiB example limit.');
    while (true) {
      const result = await waitForPromiseWithSignal(reader.read(), signal);
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maxBytes) throw new Error('Input exceeds the 32 MiB example limit.');
      chunks.push(result.value.slice());
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  signal.throwIfAborted();
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

/** Loads only the selected parser and delegates all conversion to the published authoring APIs. */
export async function createPMTilesExampleArchive(
  input: Blob | string,
  options: PMTilesExampleOptions,
  signal: AbortSignal
): Promise<Blob> {
  const tiles = selectPMTilesExampleTiles(options.bounds, options.zoom);
  if (
    !['geojson', 'arrow', 'geotiff'].includes(options.format) ||
    (options.format === 'geotiff'
      ? options.tileType !== 'png'
      : !['mvt', 'mlt'].includes(options.tileType))
  )
    throw new Error('Select MVT/MLT for vector data or PNG for GeoTIFF imagery.');
  signal.throwIfAborted();
  const pmtiles = {
    maxTiles: PMTILES_EXAMPLE_LIMITS.tiles,
    maxOutputBytes: PMTILES_EXAMPLE_LIMITS.outputBytes,
    signal
  };
  let archive: ArrayBuffer;
  if (options.format === 'geotiff') {
    if (input instanceof Blob && input.size > PMTILES_EXAMPLE_LIMITS.inputBytes)
      throw new Error('Input exceeds the 32 MiB example limit.');
    const sourceInput = typeof input === 'string' ? getPMTilesExampleURL(input).href : input;
    const [{GeoTIFFRasterSource}, {encodeRasterPMTiles}] = await waitForPromiseWithSignal(
      Promise.all([import('@loaders.gl/geotiff'), import('@loaders.gl/pmtiles/raster')]),
      signal
    );
    signal.throwIfAborted();
    const source = new GeoTIFFRasterSource(sourceInput, {
      geotiff: {rangeSchedulerProps: {maxTotalBytes: PMTILES_EXAMPLE_LIMITS.inputBytes}}
    });
    try {
      archive = await encodeRasterPMTiles(source, {tiles, bands: options.bands, pmtiles});
    } finally {
      source.finalize();
    }
  } else {
    const bytes = await readPMTilesExampleInput(input, signal);
    signal.throwIfAborted();
    const {parse} = await waitForPromiseWithSignal(import('@loaders.gl/core'), signal);
    signal.throwIfAborted();
    const table =
      options.format === 'arrow'
        ? await parse(
            bytes,
            (await waitForPromiseWithSignal(import('@loaders.gl/arrow'), signal)).ArrowLoader,
            {core: {worker: false}, arrow: {shape: 'arrow-table'}}
          )
        : await parse(
            bytes,
            (await waitForPromiseWithSignal(import('@loaders.gl/json'), signal)).GeoJSONLoader,
            {
              core: {worker: false},
              geojson: {shape: 'arrow-table'}
            }
          );
    signal.throwIfAborted();
    if (table.shape !== 'arrow-table') throw new Error('Input did not produce a GeoArrow table.');
    const {encodeGeoArrowPMTiles} = await waitForPromiseWithSignal(
      import('@loaders.gl/pmtiles/geoarrow'),
      signal
    );
    signal.throwIfAborted();
    archive = await encodeGeoArrowPMTiles(table, {
      tiles,
      tileType: options.tileType as 'mvt' | 'mlt',
      maxInputRows: PMTILES_EXAMPLE_LIMITS.rows,
      table: {maxZoom: options.zoom, indexMaxZoom: Math.min(options.zoom, 5)},
      mvt: {
        propertyColumns: options.attributes,
        idColumn: options.idColumn,
        maxFeatures: PMTILES_EXAMPLE_LIMITS.rows
      },
      mlt: {
        propertyColumns: options.attributes,
        idColumn: options.idColumn,
        maxFeatures: PMTILES_EXAMPLE_LIMITS.rows
      },
      pmtiles
    });
  }
  signal.throwIfAborted();
  return new Blob([archive], {type: 'application/vnd.pmtiles'});
}

/** Validates dataset URLs before either whole-file or range transport starts. */
function getPMTilesExampleURL(input: string): URL {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Use an HTTP(S) dataset URL without embedded credentials.');
  return url;
}
