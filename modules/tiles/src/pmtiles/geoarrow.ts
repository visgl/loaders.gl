// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MLTWriter} from '@loaders.gl/tiles/mlt';
import type {MLTWriterOptions} from '@loaders.gl/tiles/mlt';
import {MVTWriter} from '@loaders.gl/tiles/mvt';
import type {
  ArrowTableTileSourceInput,
  ArrowTableTileSourceLoaderOptions,
  MVTWriterOptions
} from '@loaders.gl/tiles/mvt';
import {ArrowTableVectorTileSource} from '@loaders.gl/tiles/mvt/arrow-table-tile-source-loader';
import {getGeoMetadata} from '@loaders.gl/core/schema';
import type {DataType} from '@loaders.gl/core/schema';
import {encodePMTiles} from './lib/encode-pmtiles';
import type {PMTilesEncodeOptions, PMTilesTile} from './pmtiles-writer-types';

/** Explicit canonical XYZ address selected for a bounded export. */
export type GeoArrowPMTilesTileIndex = Pick<PMTilesTile, 'x' | 'y' | 'z'>;

/** Controls a single-layer GeoArrow-to-vector-tile-to-PMTiles export. */
export type GeoArrowPMTilesOptions = {
  /** Tile format; defaults to mvt for compatibility. */
  readonly tileType?: 'mvt' | 'mlt';
  /** MLT layer, scalar attributes, IDs and per-tile row limit. */
  readonly mlt?: Pick<
    NonNullable<MLTWriterOptions['mlt']>,
    'layerName' | 'propertyColumns' | 'idColumn' | 'maxFeatures'
  >;
  /** Finite selected tile addresses, including empty tiles; no implicit global enumeration. */
  readonly tiles: Iterable<GeoArrowPMTilesTileIndex> | AsyncIterable<GeoArrowPMTilesTileIndex>;
  /** Existing tiler options. Output coordinates are always normalized tile-local XY. */
  readonly table?: Omit<NonNullable<ArrowTableTileSourceLoaderOptions['table']>, 'coordinates'>;
  /** Layer name, selected properties, feature IDs and per-tile row limit. */
  readonly mvt?: Pick<
    NonNullable<MVTWriterOptions['mvt']>,
    'layerName' | 'propertyColumns' | 'idColumn' | 'maxFeatures'
  >;
  /** Archive limits, internal compression, bounds and auxiliary JSON metadata. */
  readonly pmtiles?: Omit<PMTilesEncodeOptions, 'tileType' | 'tileCompression'>;
  /** Maximum input rows checked before building the existing in-memory index; default 100,000. */
  readonly maxInputRows?: number;
};

/**
 * Reuses the existing GeoArrow tiler, encodes selected nonempty tiles as MVT v2 or MLT v1, and packages PMTiles v3.
 * The input table/index and archive are in memory. Archive maxTiles also bounds all requested addresses.
 * Cancellation is forwarded to packaging and checked around tile acquisition; synchronous indexing
 * and per-tile encoding cannot be interrupted mid-call. No partial archive is returned.
 */
export async function encodeGeoArrowPMTiles(
  input: ArrowTableTileSourceInput,
  options: GeoArrowPMTilesOptions
): Promise<ArrayBuffer> {
  options = {
    ...options,
    table: {...options.table},
    mlt: {...options.mlt, propertyColumns: options.mlt?.propertyColumns?.slice()},
    mvt: {...options.mvt, propertyColumns: options.mvt?.propertyColumns?.slice()},
    pmtiles: {...options.pmtiles}
  };
  const tileType = options.tileType ?? 'mvt';
  if (!['mvt', 'mlt'].includes(tileType)) throw new Error('Unsupported GeoArrow PMTiles tileType');
  const writerOptions = tileType === 'mlt' ? options.mlt : options.mvt;
  const signal = options.pmtiles?.signal;
  signal?.throwIfAborted();
  const table = 'data' in input && 'shape' in input ? input.data : input;
  const maxInputRows = options.maxInputRows ?? 100000;
  const maxTiles = options.pmtiles?.maxTiles ?? 100000;
  if (
    !Number.isSafeInteger(maxInputRows) ||
    maxInputRows < 1 ||
    !Number.isSafeInteger(maxTiles) ||
    maxTiles < 1
  )
    throw new Error('Invalid GeoArrow PMTiles input or requested tile limit');
  if (!Number.isSafeInteger(table.numRows) || table.numRows > maxInputRows)
    throw new Error('GeoArrow PMTiles input row limit exceeded');
  const tiler = new ArrowTableVectorTileSource(input, {
    table: {...options.table, coordinates: 'local'}
  });
  const schema = await tiler.getSchema();
  signal?.throwIfAborted();
  const geoMetadata = getGeoMetadata(schema.metadata);
  const geometryColumn =
    options.table?.geometryColumn ??
    geoMetadata?.primary_column ??
    schema.fields.find(field => field.metadata?.['ARROW:extension:name'] === 'geoarrow.wkb')!.name;
  const propertyNames =
    writerOptions?.propertyColumns ??
    schema.fields
      .filter(
        field =>
          field.name !== geometryColumn &&
          !field.metadata?.['ARROW:extension:name']?.startsWith('geoarrow.') &&
          !geoMetadata?.columns[field.name]
      )
      .map(field => field.name);
  if (new Set(propertyNames).size !== propertyNames.length)
    throw new Error('Duplicate vector tile property column');
  const fields = Object.fromEntries(
    propertyNames.flatMap(name => {
      const field = schema.fields.find(field => field.name === name);
      if (!field || name === geometryColumn)
        throw new Error(`Unknown vector tile property column: ${name}`);
      const type = getFieldType(field.type);
      return type ? [[name, type]] : [];
    })
  );
  const layerName = writerOptions?.layerName ?? 'features';
  const metadata = {...options.pmtiles?.metadata, vector_layers: [{id: layerName, fields}]};
  // TileJSON summary fields describe the selected export; the archive derives its bounds/zooms.
  for (const name of ['bounds', 'minzoom', 'maxzoom', 'center', 'tiles', 'tilestats'])
    delete (metadata as Record<string, unknown>)[name];
  const maxZoom = (await tiler.getMetadata()).maxZoom!;
  return encodePMTiles(encodeTiles(), {
    ...options.pmtiles,
    metadata,
    tileType,
    tileCompression: 'none'
  });

  /** Requests selected tiles sequentially and closes the caller's iterator on cancellation/failure. */
  async function* encodeTiles(): AsyncIterable<PMTilesTile> {
    const seen = new Set<string>();
    let requested = 0;
    for await (const tile of options.tiles) {
      signal?.throwIfAborted();
      if (++requested > maxTiles) throw new Error('GeoArrow PMTiles requested tile limit exceeded');
      if (
        !Number.isInteger(tile.z) ||
        tile.z < 0 ||
        tile.z > maxZoom ||
        !Number.isInteger(tile.x) ||
        !Number.isInteger(tile.y) ||
        tile.x < 0 ||
        tile.y < 0 ||
        tile.x >= 2 ** tile.z ||
        tile.y >= 2 ** tile.z
      )
        throw new Error('Invalid GeoArrow PMTiles selected XYZ address');
      const key = `${tile.z}/${tile.x}/${tile.y}`;
      if (seen.has(key)) throw new Error('Duplicate GeoArrow PMTiles selected XYZ address');
      seen.add(key);
      const arrowTile = await tiler.getTile(tile);
      signal?.throwIfAborted();
      if (!arrowTile) continue;
      const data =
        tileType === 'mlt'
          ? MLTWriter.encodeSync(arrowTile, {
              mlt: {
                ...writerOptions,
                layerName,
                geometryColumn,
                propertyColumns: propertyNames,
                extent: options.table?.extent ?? 4096,
                coordinates: 'local'
              }
            })
          : MVTWriter.encodeSync(arrowTile, {
              mvt: {
                ...options.mvt,
                layerName,
                geometryColumn,
                propertyColumns: propertyNames,
                extent: options.table?.extent ?? 4096,
                version: 2,
                coordinates: 'local'
              }
            });
      signal?.throwIfAborted();
      if (data.byteLength) yield {...tile, data};
    }
  }
}

/** Maps supported scalar Arrow schema types to TileJSON, rejecting implicit attribute loss. */
function getFieldType(type: DataType): 'Number' | 'String' | 'Boolean' | null {
  if (typeof type === 'object' && type.type === 'dictionary') return getFieldType(type.dictionary);
  if (type === 'null') return null;
  if (type === 'bool') return 'Boolean';
  if (type === 'utf8') return 'String';
  if (typeof type === 'string' && /^(?:u?int|float)(?:8|16|32|64)?$/.test(type)) return 'Number';
  throw new Error(
    'Unsupported vector tile attribute type; explicitly select supported propertyColumns'
  );
}
