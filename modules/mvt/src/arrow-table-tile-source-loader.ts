// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  DataSource,
  type CoreAPI,
  type DataSourceOptions,
  type SourceLoader,
  type VectorTileSource,
  type GetTileParameters,
  type GetTileDataParameters,
  type TileSourceMetadata
} from '@loaders.gl/loader-utils';
import type {ArrowTable, Schema, Geometry, GeoArrowEncoding} from '@loaders.gl/schema';
import {
  GeometryConverter,
  getGeoArrowNativeGeometry,
  getGeoMetadata,
  setGeoMetadata
} from '@loaders.gl/gis';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {
  TableVectorTileSource,
  TableTileSourceLoader,
  type TableTileSourceLoaderOptions
} from './table-tile-source-loader';
import {convertFeaturesToProtoFeature} from './lib/vector-tiler/features/convert-feature';
import type {ProtoFeature} from './lib/vector-tiler/features/proto-feature';
import {wrapFeatures} from './lib/vector-tiler/features/wrap-features';
import {createArrowTile} from './lib/vector-tiler/arrow-tile';

/** In-memory Arrow tables accepted by the Arrow tile source. */
export type ArrowTableTileSourceInput = ArrowTable | arrow.Table;

/** Options for Arrow-native, two-dimensional client-side vector tiling. */
export type ArrowTableTileSourceLoaderOptions = DataSourceOptions & {
  /** Geometry selection and clipping/simplification options. */
  table?: Pick<
    NonNullable<TableTileSourceLoaderOptions['table']>,
    | 'coordinates'
    | 'maxZoom'
    | 'indexMaxZoom'
    | 'maxPointsPerTile'
    | 'tolerance'
    | 'extent'
    | 'buffer'
  > & {
    /** Geometry column; defaults to GeoParquet's primary column or the sole GeoArrow field. */
    geometryColumn?: string;
  };
};

/** Builds vector tiles from an Arrow table without converting its attributes to GeoJSON. */
export const ArrowTableTileSourceLoader = {
  dataType: null as unknown as ArrowTableVectorTileSource,
  batchType: null as never,
  name: 'ArrowTableTiler',
  id: 'arrow-table-tiler',
  module: 'mvt',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'table',
  fromUrl: true,
  fromBlob: true,
  /** Selection is explicit because any Arrow-producing loader can supply the input. */
  testURL: () => false,
  options: {table: {coordinates: 'local'}},
  defaultOptions: {table: {coordinates: 'local'}},
  /** Creates an Arrow tile source; URLs and blobs require an injected core API and loaders. */
  createDataSource(
    input: string | Blob | ArrowTableTileSourceInput | Promise<ArrowTableTileSourceInput>,
    options: ArrowTableTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ): ArrowTableVectorTileSource {
    return new ArrowTableVectorTileSource(input, options, coreApi);
  }
} as const satisfies SourceLoader<ArrowTableVectorTileSource>;

/**
 * Tiles longitude/latitude Arrow geometry into two-dimensional GeoArrow WKB tables.
 * Attributes remain columnar; clipping and geometry collections may repeat source rows.
 */
export class ArrowTableVectorTileSource
  extends DataSource<
    string | Blob | ArrowTableTileSourceInput | Promise<ArrowTableTileSourceInput>,
    ArrowTableTileSourceLoaderOptions
  >
  implements VectorTileSource
{
  /** MIME type of returned Arrow tables, not encoded MVT bytes. */
  readonly mimeType = 'application/vnd.apache.arrow.stream';
  /** Whether output coordinates are normalized relative to the tile. */
  readonly localCoordinates: boolean;
  /** Resolves after loading, validation and initial indexing. */
  readonly ready: Promise<void>;
  /** Existing clipping engine, storing only row references as feature properties. */
  private readonly tiler: TableVectorTileSource;
  /** Original Arrow columns retained for tile row gathering. */
  private table: arrow.Table | null = null;
  /** Output schema with refreshed geometry metadata. */
  private tileSchema: arrow.Schema | null = null;
  /** Name of the geometry column used for indexing and output. */
  private geometryColumn = '';

  /** Creates a source; await ready before calling getTileSync. */
  constructor(
    input: string | Blob | ArrowTableTileSourceInput | Promise<ArrowTableTileSourceInput>,
    options: ArrowTableTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) {
    super(input, options, ArrowTableTileSourceLoader.defaultOptions, coreApi);
    validateTilingOptions(options);
    this.localCoordinates = (options.table?.coordinates || 'local') === 'local';
    this.tiler = new TableVectorTileSource(
      {shape: 'geojson-table', type: 'FeatureCollection', features: []},
      {table: {...TableTileSourceLoader.defaultOptions.table, ...options.table, lineMetrics: false}}
    );
    this.getTileData = this.getTileData.bind(this);
    this.ready = this.initialize(input);
  }

  /** Returns the output schema and supported detail range. */
  async getMetadata(): Promise<TileSourceMetadata & {schema: Schema}> {
    return {schema: await this.getSchema(), minZoom: 0, maxZoom: this.tiler.tableOptions.maxZoom};
  }

  /** Returns the schema shared by output tiles. */
  async getSchema(): Promise<Schema> {
    await this.ready;
    return convertArrowToSchema(this.tileSchema!);
  }

  /** Returns a clipped Arrow table, or null when the tile contains no geometry. */
  async getVectorTile(tileIndex: GetTileParameters): Promise<ArrowTable | null> {
    await this.ready;
    return this.getTileSync(tileIndex);
  }

  /** Alias for getVectorTile, with the same Arrow output contract. */
  async getTile(tileIndex: GetTileParameters): Promise<ArrowTable | null> {
    return this.getVectorTile(tileIndex);
  }

  /** Rendering-facing tile accessor, also returning an Arrow table. */
  async getTileData(parameters: GetTileDataParameters): Promise<ArrowTable | null> {
    return this.getVectorTile(parameters.index);
  }

  /** Returns a tile synchronously after ready resolves; never mutates cached coordinates. */
  getTileSync(tileIndex: GetTileParameters): ArrowTable | null {
    if (!this.table || !this.tileSchema)
      throw new Error('Await ArrowTableVectorTileSource.ready before requesting tiles');
    if (
      ![tileIndex.x, tileIndex.y, tileIndex.z].every(Number.isInteger) ||
      tileIndex.z < 0 ||
      tileIndex.z > 24 ||
      tileIndex.y < 0 ||
      tileIndex.y >= 2 ** tileIndex.z
    )
      return null;
    const tile = this.tiler.getProtoTile(tileIndex);
    return tile?.protoFeatures.length
      ? createArrowTile(
          this.table,
          this.tileSchema,
          this.geometryColumn,
          tile,
          this.tiler.tableOptions.extent,
          this.localCoordinates
        )
      : null;
  }

  /** Loads an Arrow table and indexes only its decoded geometry and source row numbers. */
  private async initialize(
    input: string | Blob | ArrowTableTileSourceInput | Promise<ArrowTableTileSourceInput>
  ): Promise<void> {
    await this.tiler.ready;
    let loaded: unknown = await input;
    if (typeof loaded === 'string' || loaded instanceof Blob) {
      if (!this.hasCoreApi || !this.options.core.loaders?.length) {
        throw new Error(
          'ArrowTableTileSourceLoader requires core.loaders and an injected core API for URL/Blob input'
        );
      }
      loaded = await this.coreApi.load(loaded, this.options.core.loaders, this.loadOptions);
    }
    const table = loaded instanceof arrow.Table ? loaded : (loaded as ArrowTable | null)?.data;
    if (!(table instanceof arrow.Table))
      throw new Error('ArrowTableTileSourceLoader requires an Arrow table');
    const field = getGeometryField(table, this.options.table.geometryColumn);
    const encoding = (field.metadata.get('ARROW:extension:name') ||
      `geoarrow.${getGeoMetadata(table.schema.metadata)?.columns[field.name]?.encoding}`) as GeoArrowEncoding;
    this.geometryColumn = field.name;
    const column = table.getChild(field.name)!;
    const features: ProtoFeature[] = [];
    for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
      if (!column.isValid(rowIndex)) continue;
      const geometry =
        encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt'
          ? (GeometryConverter.convert(column.get(rowIndex), 'geojson-geometry') as Geometry)
          : getGeoArrowNativeGeometry(column, rowIndex, encoding);
      if (geometry)
        features.push(
          ...convertFeaturesToProtoFeature(
            {type: 'Feature', geometry, properties: {sourceRowIndex: rowIndex}},
            this.tiler.tableOptions
          )
        );
    }
    const wrappedFeatures = wrapFeatures(features, this.tiler.tableOptions);
    if (wrappedFeatures.length) this.tiler.splitTile(wrappedFeatures, 0, 0, 0);
    this.tileSchema = createTileSchema(table.schema, field, this.localCoordinates);
    this.table = table;
  }
}

/** Selects an explicitly identified GeoArrow/GeoParquet geometry field. */
function getGeometryField(table: arrow.Table, geometryColumn?: string): arrow.Field {
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const columnName = geometryColumn || geoMetadata?.primary_column;
  const fields = columnName
    ? table.schema.fields.filter(field => field.name === columnName)
    : table.schema.fields.filter(field =>
        field.metadata.get('ARROW:extension:name')?.startsWith('geoarrow.')
      );
  if (fields.length !== 1) throw new Error('Select one geometry column with table.geometryColumn');
  const field = fields[0];
  const extensionMetadata = JSON.parse(field.metadata.get('ARROW:extension:metadata') || '{}');
  const coordinateSystem = extensionMetadata.crs ?? geoMetadata?.columns[field.name]?.crs;
  if (coordinateSystem != null && !isLongitudeLatitudeCRS(coordinateSystem)) {
    throw new Error(
      'ArrowTableTileSourceLoader requires longitude/latitude WGS84 geometry; reproject before tiling'
    );
  }
  const encoding =
    field.metadata.get('ARROW:extension:name') ||
    `geoarrow.${geoMetadata?.columns[field.name]?.encoding}`;
  if (
    ![
      'geoarrow.wkb',
      'geoarrow.wkt',
      'geoarrow.point',
      'geoarrow.multipoint',
      'geoarrow.linestring',
      'geoarrow.multilinestring',
      'geoarrow.polygon',
      'geoarrow.multipolygon',
      'geoarrow.geometry',
      'geoarrow.geometrycollection'
    ].includes(encoding)
  ) {
    throw new Error(`Unsupported geometry encoding: ${encoding}`);
  }
  return field;
}

/** Recognizes the common authority and PROJJSON descriptions of longitude/latitude WGS84. */
function isLongitudeLatitudeCRS(coordinateSystem: unknown): boolean {
  if (typeof coordinateSystem === 'string') {
    return ['EPSG:4326', 'OGC:CRS84'].includes(coordinateSystem.toUpperCase());
  }
  const identifier = (coordinateSystem as {id?: {authority?: string; code?: string | number}})?.id;
  return (
    (identifier?.authority === 'EPSG' && Number(identifier.code) === 4326) ||
    (identifier?.authority === 'OGC' && identifier.code === 'CRS84')
  );
}

/** Rejects invalid index parameters before constructing the shared tiler. */
function validateTilingOptions(options: ArrowTableTileSourceLoaderOptions): void {
  const tableOptions = {...TableTileSourceLoader.defaultOptions.table, ...options.table};
  for (const name of ['maxZoom', 'indexMaxZoom'] as const) {
    if (
      !Number.isInteger(tableOptions[name]) ||
      tableOptions[name] < 0 ||
      tableOptions[name] > 24
    ) {
      throw new Error(`${name} must be an integer in the 0-24 range`);
    }
  }
  for (const name of ['extent', 'maxPointsPerTile', 'tolerance', 'buffer'] as const) {
    if (
      !Number.isFinite(tableOptions[name]) ||
      tableOptions[name] < 0 ||
      (name === 'extent' && tableOptions[name] === 0)
    )
      throw new Error(`Invalid table.${name}`);
  }
  if (!['local', 'wgs84', 'EPSG:4326'].includes(tableOptions.coordinates)) {
    throw new Error('Invalid table.coordinates');
  }
}

/** Replaces geometry metadata without retaining stale bounds, covering or dimensionality. */
function createTileSchema(
  schema: arrow.Schema,
  geometryField: arrow.Field,
  localCoordinates: boolean
): arrow.Schema {
  const metadata = new Map(schema.metadata);
  const geoMetadata = getGeoMetadata(metadata);
  setGeoMetadata(metadata, {
    version: geoMetadata?.version || '1.1.0',
    primary_column: geometryField.name,
    columns: {
      ...geoMetadata?.columns,
      [geometryField.name]: {
        encoding: 'WKB',
        geometry_types: [],
        ...(localCoordinates ? {crs: null} : {})
      }
    }
  });
  const fieldMetadata = new Map(geometryField.metadata);
  fieldMetadata.set('ARROW:extension:name', 'geoarrow.wkb');
  fieldMetadata.set(
    'ARROW:extension:metadata',
    JSON.stringify(localCoordinates ? {crs: null} : {crs: 'OGC:CRS84', crs_type: 'authority_code'})
  );
  const fields = schema.fields.map(field =>
    field === geometryField
      ? new arrow.Field(field.name, new arrow.Binary(), false, fieldMetadata)
      : field
  );
  return new arrow.Schema(fields, metadata);
}
