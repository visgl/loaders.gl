// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {waitForPromiseWithSignal} from '@loaders.gl/loader-utils';
import type {PMTilesTile} from '@loaders.gl/tiles/pmtiles';

/** In-memory export ceilings; actual allocations depend on the browser and available memory. */
export const PMTILES_EXAMPLE_LIMITS = {
  /** Whole-vector input bytes or aggregate requested remote GeoTIFF range bytes. */
  inputBytes: 2 ** 32 - 1,
  /** Complete archive bytes. */
  outputBytes: 2 ** 32 - 1,
  /** Input table rows and per-tile features. */
  rows: 50000,
  /** All requested addresses, including empty tiles. */
  tiles: 100000
} as const;

/** Serializable counters for real work; tile totals include addresses without data. */
export type PMTilesExampleProgress = {
  /** Current conversion operation. */
  phase: 'reading' | 'parsing' | 'tiles' | 'packaging' | 'complete';
  /** Fully inspected addresses, including empty tiles. */
  completedTiles: number;
  /** Originally selected addresses. */
  totalTiles: number;
  /** Current XYZ address, while producing a tile. */
  currentTile?: string;
  /** Bytes returned by source reads, including repeated ranges; null for uninstrumented local raster reads. */
  bytesRead: number | null;
  /** Complete archive size, available after packaging. */
  outputBytes: number;
};

/** Runtime controls constructed inside the worker, never sent as functions over postMessage. */
export type PMTilesExampleControls = {
  /** Receives throttled counters and immediate stage changes. */
  onProgress?: (progress: PMTilesExampleProgress) => void;
  /** Stops enumeration at the next tile boundary and packages completed work. */
  shouldFinish?: () => boolean;
};

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
  /** Single output zoom, integer 0–24. */
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
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 24)
    throw new Error('Choose an integer zoom from 0 through 24.');
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
    throw new Error('Select a smaller area or lower zoom (maximum 100,000 requested tiles).');
  const tiles: Pick<PMTilesTile, 'z' | 'x' | 'y'>[] = [];
  for (let y = minimumY; y <= maximumY; y++)
    for (let x = minimumX; x <= maximumX; x++) tiles.push({z: zoom, x, y});
  return tiles;
}

/** Reads a bounded input; remote streaming is stopped before accepting an oversized body. */
export async function readPMTilesExampleInput(
  input: Blob | string,
  signal: AbortSignal,
  maxBytes: number = PMTILES_EXAMPLE_LIMITS.inputBytes,
  onBytes?: (bytes: number) => void
): Promise<ArrayBuffer> {
  signal.throwIfAborted();
  if (input instanceof Blob) {
    if (input.size > maxBytes)
      throw new Error(`Input exceeds the ${maxBytes.toLocaleString()} byte limit.`);
    const bytes = await waitForPromiseWithSignal(input.arrayBuffer(), signal);
    onBytes?.(bytes.byteLength);
    return bytes;
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
    if (declared > maxBytes)
      throw new Error(`Input exceeds the ${maxBytes.toLocaleString()} byte limit.`);
    while (true) {
      const result = await waitForPromiseWithSignal(reader.read(), signal);
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maxBytes)
        throw new Error(`Input exceeds the ${maxBytes.toLocaleString()} byte limit.`);
      chunks.push(result.value.slice());
      onBytes?.(size);
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
  signal: AbortSignal,
  controls: PMTilesExampleControls = {}
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
  let progress: PMTilesExampleProgress = {
    phase: 'reading',
    completedTiles: 0,
    totalTiles: tiles.length,
    bytesRead: options.format === 'geotiff' && input instanceof Blob ? null : 0,
    outputBytes: 0
  };
  let lastReportTime = -Infinity;
  /** Publishes actual work counters, throttling counters while preserving stage changes and the first completed tile. */
  function report(
    update: Partial<PMTilesExampleProgress>,
    force = (update.phase !== undefined && update.phase !== progress.phase) ||
      update.completedTiles === 1
  ): void {
    progress = {...progress, ...update};
    const now = performance.now();
    if (force || now - lastReportTime >= 100) {
      controls.onProgress?.({...progress});
      lastReportTime = now;
    }
  }
  report({});
  /** Yields between tile boundaries so the worker can receive Finish without discarding encoded tiles. */
  async function* selectTiles(): AsyncIterable<Pick<PMTilesTile, 'z' | 'x' | 'y'>> {
    let lastYieldTime = 0;
    for (const tile of tiles) {
      if (progress.completedTiles <= 1 || performance.now() - lastYieldTime >= 16) {
        await new Promise(resolve => setTimeout(resolve, 0));
        lastYieldTime = performance.now();
      }
      signal.throwIfAborted();
      if (controls.shouldFinish?.()) break;
      report({phase: 'tiles', currentTile: `${tile.z}/${tile.x}/${tile.y}`});
      yield tile;
      report({completedTiles: progress.completedTiles + 1});
    }
    report({phase: 'packaging', currentTile: undefined});
  }
  const pmtiles = {
    maxTiles: PMTILES_EXAMPLE_LIMITS.tiles,
    maxOutputBytes: PMTILES_EXAMPLE_LIMITS.outputBytes,
    signal
  };
  let archive: ArrayBuffer;
  if (options.format === 'geotiff') {
    const sourceInput = typeof input === 'string' ? getPMTilesExampleURL(input).href : input;
    const [{GeoTIFFRasterSource}, {encodeRasterPMTiles}] = await waitForPromiseWithSignal(
      Promise.all([import('@loaders.gl/raster/geotiff/index'), import('@loaders.gl/tiles/pmtiles/raster')]),
      signal
    );
    signal.throwIfAborted();
    const source = new GeoTIFFRasterSource(sourceInput, {
      geotiff: {
        requireContentRange: true,
        rangeSchedulerProps: {
          maxTotalBytes: PMTILES_EXAMPLE_LIMITS.inputBytes,
          onEvent(event) {
            if (event.type === 'response')
              report({bytesRead: (progress.bytesRead ?? 0) + (event.responseBytes ?? 0)}, false);
          }
        }
      }
    });
    try {
      archive = await encodeRasterPMTiles(source, {
        tiles: selectTiles(),
        bands: options.bands,
        pmtiles
      });
    } finally {
      source.finalize();
    }
  } else {
    const bytes = await readPMTilesExampleInput(
      input,
      signal,
      PMTILES_EXAMPLE_LIMITS.inputBytes,
      bytesRead => report({bytesRead}, false)
    );
    report({phase: 'parsing'});
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
      import('@loaders.gl/tiles/pmtiles/geoarrow'),
      signal
    );
    signal.throwIfAborted();
    archive = await encodeGeoArrowPMTiles(table, {
      tiles: selectTiles(),
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
  report({phase: 'complete', outputBytes: archive.byteLength});
  return new Blob([archive], {type: 'application/vnd.pmtiles'});
}

/** Validates dataset URLs before either whole-file or range transport starts. */
function getPMTilesExampleURL(input: string): URL {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Use an HTTP(S) dataset URL without embedded credentials.');
  return url;
}
