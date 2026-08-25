// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI} from '@loaders.gl/loader-utils';
import {DataSource as BaseDataSource} from '@loaders.gl/loader-utils';
import * as arrow from 'apache-arrow';

import type {
  IcebergDataFile,
  IcebergBoundingBox,
  IcebergSpatialFilter,
  IcebergDeleteFile,
  IcebergManifestFile,
  IcebergParquetFile,
  IcebergScanPlan,
  IcebergSnapshot,
  IcebergTableMetadata,
  IcebergTableSourceOptions
} from './iceberg-types';
import {parseAvro} from './lib/parsers/parse-avro';
import {ParquetDatasetSource} from './parquet-dataset-source';
import type {
  ParquetDatasetBatch,
  ParquetComparisonPredicate,
  ParquetDatasetPartitionValue,
  ParquetPredicate,
  ParquetInPredicate,
  ParquetDatasetReadOptions,
  ParquetDatasetSourceOptions
} from './parquet-source-types';

type IcebergEqualityDelete = {
  /** Top-level data-column names covered by the delete. */
  readonly fields: readonly string[];
  /** Equality key values in the same order as `fields`. */
  readonly rows: readonly (readonly unknown[])[];
  /** Partition values limiting the delete's applicability, when present. */
  readonly partition?: Readonly<Record<string, unknown>>;
  /** Delete sequence number used to avoid applying stale deletes. */
  readonly dataSequenceNumber?: number;
};

type IcebergPositionDelete = {
  readonly positions: ReadonlySet<number>;
  readonly dataSequenceNumber?: number;
};

/** Options accepted by `IcebergTableSource`. */
export type IcebergSourceOptions = ParquetDatasetSourceOptions & {
  iceberg?: IcebergTableSourceOptions;
};

/** Options for scanning the current Iceberg snapshot as Parquet batches. */
export type IcebergScanOptions = ParquetDatasetReadOptions & {
  /** Reads a specific snapshot instead of the table's current snapshot. */
  snapshotId?: number;
  /** Reads the snapshot selected by a named Iceberg branch or tag. */
  snapshotRef?: string;
  /** Applies Iceberg position deletes after Parquet batches are decoded. */
  applyDeletes?: boolean;
  /** Conservatively prunes files whose declared geometry bounds miss this envelope. */
  spatialFilter?: IcebergSpatialFilter;
};

/**
 * Read-only Iceberg table metadata source.
 *
 * The source owns Iceberg metadata and manifest discovery, then delegates selected data files to
 * `ParquetDatasetSource` for projection, filtering, range access, workers, and Arrow materialization.
 */
export class IcebergTableSource extends BaseDataSource<string, IcebergSourceOptions> {
  private metadataPromise: Promise<IcebergTableMetadata> | null = null;
  private readonly closeController = new AbortController();
  private closed = false;

  constructor(data: string, options: IcebergSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Loads and validates the table metadata JSON. Results are cached for the source lifetime. */
  async getMetadata(signal?: AbortSignal): Promise<IcebergTableMetadata> {
    this.assertOpen();
    if (!this.metadataPromise) {
      this.metadataPromise = this.loadMetadata(signal);
    }
    return this.metadataPromise;
  }

  /** Returns the snapshot selected by the table metadata, if one exists. */
  async getCurrentSnapshot(signal?: AbortSignal): Promise<IcebergSnapshot | undefined> {
    return this.getSnapshot(undefined, undefined, signal);
  }

  /** Returns a selected snapshot, defaulting to the table's current snapshot. */
  private async getSnapshot(
    snapshotId: number | undefined,
    snapshotRef: string | undefined,
    signal?: AbortSignal
  ): Promise<IcebergSnapshot | undefined> {
    const metadata = await this.getMetadata(signal);
    if (snapshotId !== undefined && snapshotRef !== undefined) {
      throw new Error('Iceberg snapshotId and snapshotRef are mutually exclusive');
    }
    const reference = snapshotRef ? metadata.refs?.[snapshotRef] : undefined;
    if (snapshotRef && !reference)
      throw new Error(`Iceberg snapshot reference not found: ${snapshotRef}`);
    const selectedSnapshotId =
      snapshotId ?? reference?.['snapshot-id'] ?? metadata['current-snapshot-id'];
    if (selectedSnapshotId === undefined || selectedSnapshotId === -1) return undefined;
    return metadata.snapshots?.find(snapshot => snapshot['snapshot-id'] === selectedSnapshotId);
  }

  /** Builds a data and delete-file plan from one snapshot without opening data files. */
  async getScanPlan(
    signal?: AbortSignal,
    snapshotId?: number,
    snapshotRef?: string
  ): Promise<IcebergScanPlan> {
    const metadata = await this.getMetadata(signal);
    const snapshot = await this.getSnapshot(snapshotId, snapshotRef, signal);
    if (!snapshot?.['manifest-list'])
      return {dataFiles: [], deleteFiles: [], snapshotId, snapshotRef};
    const schemaId = snapshot['schema-id'] ?? metadata['current-schema-id'];
    const manifestList = await this.readAvroRecords<IcebergManifestFile>(
      resolveIcebergLocation(metadata.location, snapshot['manifest-list']),
      signal
    );
    const dataFiles: IcebergParquetFile[] = [];
    const deleteFiles: IcebergDeleteFile[] = [];
    for (const manifest of manifestList) {
      const isDelete = isDeleteManifest(manifest);
      if (!isDelete && !isDataManifest(manifest)) continue;
      const entries = await this.readAvroRecords<Record<string, unknown>>(
        resolveIcebergLocation(metadata.location, manifest.manifest_path),
        signal
      );
      for (const entry of entries) {
        if (isDeletedManifestEntry(entry)) continue;
        const dataFile = entry.data_file as IcebergDataFile | undefined;
        if (!dataFile || typeof dataFile.file_path !== 'string') continue;
        if (isDelete) {
          deleteFiles.push(
            createIcebergDeleteFile(
              metadata.location,
              dataFile,
              manifest,
              snapshot['snapshot-id'],
              schemaId
            )
          );
        } else if (dataFile.file_format?.toLowerCase() === 'parquet') {
          dataFiles.push(
            createIcebergParquetFile(
              metadata.location,
              dataFile,
              manifest,
              snapshot['snapshot-id'],
              schemaId
            )
          );
        }
      }
    }
    return {dataFiles, deleteFiles, snapshotId: snapshot['snapshot-id'], snapshotRef};
  }

  /** Reads the selected snapshot's active Parquet data files. */
  async getParquetFiles(
    signal?: AbortSignal,
    snapshotId?: number,
    snapshotRef?: string
  ): Promise<readonly IcebergParquetFile[]> {
    return (await this.getScanPlan(signal, snapshotId, snapshotRef)).dataFiles;
  }

  /** Reads delete files from the selected snapshot without applying them to Parquet rows. */
  async getDeleteFiles(
    signal?: AbortSignal,
    snapshotId?: number,
    snapshotRef?: string
  ): Promise<readonly IcebergDeleteFile[]> {
    return (await this.getScanPlan(signal, snapshotId, snapshotRef)).deleteFiles;
  }

  /** Reads the current snapshot as Arrow batches through the existing Parquet dataset source. */
  async *scan(options: IcebergScanOptions = {}): AsyncIterable<ParquetDatasetBatch> {
    this.assertOpen();
    const metadata = await this.getMetadata(options.signal);
    const plan = await this.getScanPlan(options.signal, options.snapshotId, options.snapshotRef);
    const positionDeletes = options.applyDeletes
      ? await this.loadPositionDeletes(plan.deleteFiles, metadata.location, options.signal)
      : undefined;
    const equalityDeletes = options.applyDeletes
      ? await this.loadEqualityDeletes(plan.deleteFiles, metadata, options.signal)
      : [];
    const equalityColumns = getEqualityDeleteColumns(equalityDeletes);
    const readOptions = addEqualityColumns(options, equalityColumns);
    const parquetSource = new ParquetDatasetSource(
      plan.dataFiles
        .filter(
          file =>
            canMatchIcebergPredicate(file, options.predicate, metadata) &&
            canMatchIcebergSpatialFilter(file, options.spatialFilter, metadata)
        )
        .map(file => ({
          data: file.data,
          id: file.data,
          partitions: getIcebergPartitions(
            file.partition,
            file.partitionSpecId,
            file.schemaId,
            metadata
          ),
          metadata: {
            iceberg: {
              fileSize: file.fileSize,
              recordCount: file.recordCount,
              partition: file.partition,
              lowerBounds: file.lowerBounds,
              upperBounds: file.upperBounds,
              dataSequenceNumber: file.dataSequenceNumber
            }
          }
        })),
      this.options,
      this.coreApi
    );
    try {
      for await (const batch of parquetSource.read(readOptions)) {
        const filteredBatch = options.applyDeletes
          ? applyIcebergDeletes(batch, positionDeletes, equalityDeletes, options.columns)
          : batch;
        if (filteredBatch.length > 0) yield filteredBatch;
      }
    } finally {
      await parquetSource.close();
    }
  }

  /** Permanently closes the source and aborts an in-flight metadata request. */
  async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true;
      this.closeController.abort();
    }
  }

  private async loadMetadata(signal?: AbortSignal): Promise<IcebergTableMetadata> {
    const abortController = new AbortController();
    const abortSignal = combineAbortSignals(signal, this.closeController.signal, abortController);
    try {
      const response = await this.fetch(this.data, {
        headers: this.options.iceberg?.headers,
        signal: abortSignal.signal
      });
      if (!response.ok) {
        throw new Error(`Iceberg metadata request failed with HTTP ${response.status}`);
      }
      const metadata = (await response.json()) as IcebergTableMetadata;
      validateIcebergTableMetadata(metadata);
      return metadata;
    } finally {
      abortSignal.dispose();
    }
  }

  private async readAvroRecords<RecordT>(url: string, signal?: AbortSignal): Promise<RecordT[]> {
    const abortController = new AbortController();
    const abortSignal = combineAbortSignals(signal, this.closeController.signal, abortController);
    try {
      const response = await this.fetch(url, {
        headers: this.options.iceberg?.headers,
        signal: abortSignal.signal
      });
      if (!response.ok)
        throw new Error(`Iceberg manifest request failed with HTTP ${response.status}`);
      const table = await parseAvro(await response.arrayBuffer(), {longType: 'number'});
      return table.data.toArray() as RecordT[];
    } finally {
      abortSignal.dispose();
    }
  }

  /** Reads position-delete files into a source-file to row-position index. */
  private async loadPositionDeletes(
    deleteFiles: readonly IcebergDeleteFile[],
    baseLocation: string,
    signal?: AbortSignal
  ): Promise<ReadonlyMap<string, readonly IcebergPositionDelete[]>> {
    const positions = new Map<string, IcebergPositionDelete[]>();
    for (const deleteFile of deleteFiles) {
      if (!isPositionDelete(deleteFile)) continue;
      const records = await this.readAvroRecords<Record<string, unknown>>(deleteFile.data, signal);
      const filePositions = new Map<string, Set<number>>();
      for (const record of records) {
        if (typeof record.file_path !== 'string' || typeof record.pos !== 'number') continue;
        const filePath = resolveIcebergLocation(baseLocation, record.file_path);
        const rowPositions = filePositions.get(filePath) || new Set<number>();
        rowPositions.add(record.pos);
        filePositions.set(filePath, rowPositions);
      }
      for (const [filePath, rowPositions] of filePositions) {
        const deletes = positions.get(filePath) || [];
        deletes.push({positions: rowPositions, dataSequenceNumber: deleteFile.dataSequenceNumber});
        positions.set(filePath, deletes);
      }
    }
    return positions;
  }

  /** Reads equality-delete files and resolves their Iceberg field IDs to current schema names. */
  private async loadEqualityDeletes(
    deleteFiles: readonly IcebergDeleteFile[],
    metadata: IcebergTableMetadata,
    signal?: AbortSignal
  ): Promise<readonly IcebergEqualityDelete[]> {
    const equalityDeletes: IcebergEqualityDelete[] = [];
    for (const deleteFile of deleteFiles) {
      if (!isEqualityDelete(deleteFile)) continue;
      if (deleteFile.format.toLowerCase() !== 'avro') {
        throw new Error(`Unsupported equality delete format: ${deleteFile.format}`);
      }
      const fieldIds = deleteFile.equalityFieldIds;
      if (!fieldIds?.length) throw new Error('Equality delete file has no field IDs');
      const fields = resolveIcebergFieldNames(fieldIds, metadata, deleteFile.schemaId);
      const records = await this.readAvroRecords<Record<string, unknown>>(deleteFile.data, signal);
      equalityDeletes.push({
        fields,
        partition: deleteFile.partition,
        dataSequenceNumber: deleteFile.dataSequenceNumber,
        rows: records.map(record =>
          fields.map((field, index) => getDeleteRecordValue(record, field, fieldIds[index]))
        )
      });
    }
    return equalityDeletes;
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('Iceberg table source is closed');
  }
}

/** Identifies a position-delete plan entry. */
function isPositionDelete(deleteFile: IcebergDeleteFile): boolean {
  return deleteFile.content === 1 || deleteFile.content === 'position';
}

/** Identifies an equality-delete plan entry. */
function isEqualityDelete(deleteFile: IcebergDeleteFile): boolean {
  return deleteFile.content === 2 || deleteFile.content === 'equality';
}

/** Adds equality-delete columns to the Parquet read without changing requested output columns. */
function addEqualityColumns(
  options: IcebergScanOptions,
  equalityColumns: readonly string[]
): IcebergScanOptions {
  if (!options.applyDeletes || equalityColumns.length === 0 || !options.columns) return options;
  const columns = [...options.columns];
  for (const column of equalityColumns) {
    if (!columns.includes(column)) columns.push(column);
  }
  return {...options, columns};
}

/** Removes position and equality-deleted rows while retaining Arrow output and provenance. */
function applyIcebergDeletes(
  batch: ParquetDatasetBatch,
  positionsByFile: ReadonlyMap<string, readonly IcebergPositionDelete[]> | undefined,
  equalityDeletes: readonly IcebergEqualityDelete[],
  outputColumns: readonly string[] | undefined
): ParquetDatasetBatch {
  const sourcePositions = positionsByFile?.get(batch.sourceUrl || batch.source);
  const keptIndexes: number[] = [];
  for (let index = 0; index < batch.length; index++) {
    const sourcePosition = batch.rowIndices?.[index] ?? batch.rowOffset + index;
    if (
      sourcePositions?.some(
        deleteFile =>
          deleteFile.positions.has(sourcePosition) &&
          isDeleteSequenceApplicable(batch, deleteFile.dataSequenceNumber)
      )
    )
      continue;
    if (equalityDeletes.some(deleteFile => matchesEqualityDelete(batch, index, deleteFile))) {
      continue;
    }
    keptIndexes.push(index);
  }
  const allColumns = batch.data.schema.fields.map(field => field.name);
  const selectedColumns = outputColumns ? [...outputColumns] : allColumns;
  const needsColumnProjection =
    selectedColumns.length !== allColumns.length ||
    selectedColumns.some((column, index) => column !== allColumns[index]);
  if (keptIndexes.length === batch.length && !needsColumnProjection) return batch;
  const columns: Record<string, unknown[]> = {};
  for (const columnName of selectedColumns) {
    const column = batch.data.getChild(columnName);
    if (!column)
      throw new Error(`Equality delete column is missing from Parquet output: ${columnName}`);
    columns[columnName] = keptIndexes.map(index => column.get(index));
  }
  const rowGroupRowIndices = keptIndexes.map(
    index => batch.rowGroupRowIndices?.[index] ?? batch.rowGroupRowOffset + index
  );
  const rowIndices = keptIndexes.map(index => batch.rowIndices?.[index] ?? batch.rowOffset + index);
  const data = arrow.tableFromArrays(columns);
  return {
    ...batch,
    data,
    length: keptIndexes.length,
    rowCount: keptIndexes.length,
    rowGroupRowIndices,
    rowIndices,
    metadata: batch.metadata ? {...batch.metadata, rowCount: keptIndexes.length} : batch.metadata
  };
}

/** Tests one decoded row against one equality-delete key. */
function matchesEqualityDelete(
  batch: ParquetDatasetBatch,
  rowIndex: number,
  deleteFile: IcebergEqualityDelete
): boolean {
  if (!matchesDeletePartition(batch, deleteFile) || !matchesDeleteSequence(batch, deleteFile)) {
    return false;
  }
  return deleteFile.rows.some(values =>
    deleteFile.fields.every((field, index) => {
      const column = batch.data.getChild(field);
      return column ? compareDeleteValues(column.get(rowIndex), values[index]) : false;
    })
  );
}

/** Conservatively limits equality deletes to the data-file partition they describe. */
function matchesDeletePartition(
  batch: ParquetDatasetBatch,
  deleteFile: IcebergEqualityDelete
): boolean {
  if (!deleteFile.partition || !batch.datasetPartitions) return true;
  return Object.entries(deleteFile.partition).every(([key, value]) => {
    const actual = batch.datasetPartitions?.[key];
    return actual === undefined || compareDeleteValues(actual, value);
  });
}

/** Avoids applying a delete whose sequence is not newer than the data file. */
function matchesDeleteSequence(
  batch: ParquetDatasetBatch,
  deleteFile: IcebergEqualityDelete
): boolean {
  return isDeleteSequenceApplicable(batch, deleteFile.dataSequenceNumber);
}

/** Returns whether a delete sequence is newer than the current data-file sequence. */
function isDeleteSequenceApplicable(batch: ParquetDatasetBatch, deleteSequence?: number): boolean {
  if (deleteSequence === undefined) return true;
  const metadata = batch.datasetFileMetadata?.iceberg;
  if (!metadata || typeof metadata !== 'object') return true;
  const dataSequenceNumber = (metadata as {dataSequenceNumber?: unknown}).dataSequenceNumber;
  return typeof dataSequenceNumber !== 'number' || deleteSequence > dataSequenceNumber;
}

/** Compares delete-key values, including binary, date, and numeric representations. */
function compareDeleteValues(left: unknown, right: unknown): boolean {
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (
    (typeof left === 'number' || typeof left === 'bigint') &&
    (typeof right === 'number' || typeof right === 'bigint')
  ) {
    return Number(left) === Number(right);
  }
  return Object.is(left, right);
}

/** Resolves equality-delete field IDs through the schema selected by the snapshot. */
function resolveIcebergFieldNames(
  fieldIds: readonly number[],
  metadata: IcebergTableMetadata,
  schemaId?: number
): string[] {
  const schema = metadata.schemas?.find(
    candidate => candidate['schema-id'] === (schemaId ?? metadata['current-schema-id'])
  );
  return fieldIds.map(fieldId => {
    const field = schema?.fields?.find(candidate => candidate.id === fieldId);
    if (typeof field?.name !== 'string') {
      throw new Error(
        `Equality delete field ID ${fieldId} is absent from the selected Iceberg schema`
      );
    }
    return field.name;
  });
}

/** Reads a delete value by schema name, falling back to a numeric field-ID key. */
function getDeleteRecordValue(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
  fieldId: number
): unknown {
  if (Object.prototype.hasOwnProperty.call(record, fieldName)) return record[fieldName];
  return record[String(fieldId)];
}

/** Returns the unique top-level columns required to evaluate equality deletes. */
function getEqualityDeleteColumns(equalityDeletes: readonly IcebergEqualityDelete[]): string[] {
  return [...new Set(equalityDeletes.flatMap(deleteFile => deleteFile.fields))];
}

/** Conservatively tests whether an Iceberg file's bounds can satisfy a Parquet predicate. */
function canMatchIcebergPredicate(
  file: IcebergParquetFile,
  predicate: ParquetPredicate | undefined,
  metadata: IcebergTableMetadata
): boolean {
  if (!predicate) return true;
  if (predicate.op === 'and')
    return predicate.args.every(child => canMatchIcebergPredicate(file, child, metadata));
  if (predicate.op === 'or')
    return predicate.args.some(child => canMatchIcebergPredicate(file, child, metadata));
  if (predicate.op === 'not') return true;
  if (predicate.op === 'isNull') return true;

  const leaf = predicate as ParquetComparisonPredicate | ParquetInPredicate;
  const property = getPredicateProperty(leaf);
  const bounds = getIcebergBounds(file, property, metadata);
  if (!bounds) return true;
  if (leaf.op === 'in') {
    return leaf.args[1].some(value => canMatchIcebergComparison(bounds, '=', value));
  }
  return canMatchIcebergComparison(bounds, leaf.op, leaf.args[1]);
}

/** Conservatively determines whether a data file can intersect a spatial envelope. */
function canMatchIcebergSpatialFilter(
  file: IcebergParquetFile,
  spatialFilter: IcebergSpatialFilter | undefined,
  metadata: IcebergTableMetadata
): boolean {
  if (!spatialFilter) return true;
  const bounds = getIcebergSpatialBounds(file, spatialFilter.column, metadata);
  if (!bounds) return true;
  return !areBoundingBoxesDisjoint(bounds, spatialFilter.bbox);
}

/** Resolves a geometry column's conservative bounds from Iceberg lower/upper bounds. */
function getIcebergSpatialBounds(
  file: IcebergParquetFile,
  property: string,
  metadata: IcebergTableMetadata
): IcebergBoundingBox | undefined {
  const lowerBounds = file.lowerBounds;
  const upperBounds = file.upperBounds;
  if (!lowerBounds || !upperBounds) return undefined;
  const schema = metadata.schemas?.find(
    candidate => candidate['schema-id'] === (file.schemaId ?? metadata['current-schema-id'])
  );
  const field = schema?.fields?.find(candidate => candidate.name === property);
  const fieldId = typeof field?.id === 'number' ? field.id : undefined;
  const lower = lowerBounds[property] ?? (fieldId === undefined ? undefined : lowerBounds[fieldId]);
  const upper = upperBounds[property] ?? (fieldId === undefined ? undefined : upperBounds[fieldId]);
  return normalizeIcebergBoundingBox(lower, upper);
}

/** Normalizes common Iceberg/GeoParquet bounding-box representations without guessing unknown data. */
function normalizeIcebergBoundingBox(
  lower: unknown,
  upper: unknown
): IcebergBoundingBox | undefined {
  const lowerValues = getBoundingBoxValues(lower);
  const upperValues = getBoundingBoxValues(upper);
  if (lowerValues?.length === 4) {
    return [lowerValues[0], lowerValues[1], lowerValues[2], lowerValues[3]];
  }
  if (lowerValues?.length === 2 && upperValues?.length === 2) {
    return [lowerValues[0], lowerValues[1], upperValues[0], upperValues[1]];
  }
  return undefined;
}

/** Reads numeric bounds from arrays or common named-bound objects. */
function getBoundingBoxValues(value: unknown): number[] | undefined {
  if (Array.isArray(value) && (value.length === 2 || value.length === 4)) {
    const numbers = value.map(getNumberValue);
    return numbers.every(isNumber) ? numbers : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const keys = ['xmin', 'ymin', 'xmax', 'ymax'];
  const numbers = keys.map(key => getNumberValue(record[key]));
  return numbers.every(isNumber) ? numbers : undefined;
}

/** Tests two axis-aligned envelopes without excluding touching boundaries. */
function areBoundingBoxesDisjoint(left: IcebergBoundingBox, right: IcebergBoundingBox): boolean {
  return left[2] < right[0] || left[0] > right[2] || left[3] < right[1] || left[1] > right[3];
}

/** Returns the top-level field name used by a Parquet predicate. */
function getPredicateProperty(predicate: ParquetComparisonPredicate | ParquetInPredicate): string {
  const property = predicate.args[0].property;
  return typeof property === 'string' ? property : property[0];
}

/** Resolves an Iceberg field's lower and upper bounds by name or schema field identifier. */
function getIcebergBounds(
  file: IcebergParquetFile,
  property: string,
  metadata: IcebergTableMetadata
): {lower: unknown; upper: unknown} | undefined {
  const lowerBounds = file.lowerBounds;
  const upperBounds = file.upperBounds;
  if (!lowerBounds || !upperBounds) return undefined;
  let fieldId: number | undefined;
  const schema = metadata.schemas?.find(
    candidate => candidate['schema-id'] === (file.schemaId ?? metadata['current-schema-id'])
  );
  let fieldType: unknown;
  for (const field of schema?.fields || []) {
    if (field.name === property) {
      fieldType = field.type;
      if (typeof field.id === 'number') fieldId = field.id;
    }
  }
  const lower = decodeIcebergBound(
    lowerBounds[property] ?? (fieldId === undefined ? undefined : lowerBounds[fieldId]),
    fieldType
  );
  const upper = decodeIcebergBound(
    upperBounds[property] ?? (fieldId === undefined ? undefined : upperBounds[fieldId]),
    fieldType
  );
  if (lower === undefined || upper === undefined) return undefined;
  return {lower, upper};
}

/** Decodes an Iceberg binary bound when the table schema identifies a primitive type. */
function decodeIcebergBound(value: unknown, fieldType: unknown): unknown {
  if (!(value instanceof Uint8Array)) return value;
  const typeName =
    typeof fieldType === 'string'
      ? fieldType
      : fieldType && typeof fieldType === 'object' && 'type' in fieldType
        ? (fieldType as {type?: unknown}).type
        : undefined;
  if (typeof typeName !== 'string') return undefined;
  const dataView = new DataView(value.buffer, value.byteOffset, value.byteLength);
  switch (typeName) {
    case 'boolean':
      return value.length === 1 ? value[0] !== 0 : undefined;
    case 'int':
    case 'date':
      return value.length === 4 ? dataView.getInt32(0, false) : undefined;
    case 'long':
    case 'time':
    case 'timestamp':
    case 'timestz':
      return value.length === 8 ? dataView.getBigInt64(0, false) : undefined;
    case 'float':
      return value.length === 4 ? dataView.getFloat32(0, false) : undefined;
    case 'double':
      return value.length === 8 ? dataView.getFloat64(0, false) : undefined;
    case 'string':
      return new TextDecoder().decode(value);
    default:
      return undefined;
  }
}

/** Converts scalar Iceberg partition fields into the dataset source's reusable partition filter. */
function getIcebergPartitions(
  partition: Readonly<Record<string, unknown>> | undefined,
  partitionSpecId: number | undefined,
  schemaId: number | undefined,
  metadata: IcebergTableMetadata
): Readonly<Record<string, ParquetDatasetPartitionValue>> | undefined {
  if (!partition) return undefined;
  const result: Record<string, ParquetDatasetPartitionValue> = {};
  for (const [key, value] of Object.entries(partition)) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value;
    }
  }
  const partitionSpec = metadata['partition-specs']?.find(
    candidate => candidate['spec-id'] === partitionSpecId
  );
  const schema = metadata.schemas?.find(
    candidate => candidate['schema-id'] === (schemaId ?? metadata['current-schema-id'])
  );
  for (const field of partitionSpec?.fields || []) {
    if (field.transform !== 'identity' || typeof field['source-id'] !== 'number') continue;
    const schemaField = schema?.fields?.find(candidate => candidate.id === field['source-id']);
    if (typeof schemaField?.name !== 'string' || typeof field.name !== 'string') continue;
    const value = result[field.name];
    if (value !== undefined) result[schemaField.name] = value;
  }
  return result;
}

/** Normalizes Avro map values, which may decode as JavaScript Maps or plain objects. */
function normalizeIcebergMap(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (!value) return undefined;
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value === 'object') return value as Readonly<Record<string, unknown>>;
  return undefined;
}

/** Reads a field from plain manifest records and Arrow StructRow-like records. */
function getIcebergRecordValue(record: unknown, key: string): unknown {
  if (!record || typeof record !== 'object') return undefined;
  if (key in record) return (record as Record<string, unknown>)[key];
  if ('get' in record && typeof (record as {get?: unknown}).get === 'function') {
    return (record as {get: (field: string) => unknown}).get(key);
  }
  return undefined;
}

/** Normalizes Avro array values that may be decoded as Arrow vectors or JavaScript arrays. */
function normalizeNumberArray(value: unknown): readonly number[] | undefined {
  if (typeof value === 'number') return [value];
  if (Array.isArray(value)) return value.map(getNumberValue).filter(isNumber);
  if (value && typeof value === 'object' && 'toArray' in value) {
    const arrayValue = (value as {toArray: () => unknown[]}).toArray();
    return arrayValue.map(getNumberValue).filter(isNumber);
  }
  if (value && typeof value !== 'string' && Symbol.iterator in Object(value)) {
    return Array.from(value as Iterable<unknown>)
      .map(getNumberValue)
      .filter(isNumber);
  }
  return undefined;
}

/** Extracts a number from a JavaScript value or an Arrow scalar wrapper. */
function getNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value === 'object' && 'value' in value) {
    const scalarValue = (value as {value?: unknown}).value;
    if (typeof scalarValue === 'number') return scalarValue;
    if (typeof scalarValue === 'bigint') return Number(scalarValue);
  }
  if (value && typeof value === 'object' && 'toJSON' in value) {
    const jsonValue = (value as {toJSON: () => unknown}).toJSON();
    return typeof jsonValue === 'number' ? jsonValue : undefined;
  }
  return undefined;
}

/** Narrows an optional number after delete-array normalization. */
function isNumber(value: number | undefined): value is number {
  return value !== undefined;
}

/** Applies a comparison to file bounds without pruning values that cannot be compared safely. */
function canMatchIcebergComparison(
  bounds: {lower: unknown; upper: unknown},
  operator: '=' | '<>' | '<' | '<=' | '>' | '>=',
  value: unknown
): boolean {
  const lowerComparison = compareIcebergValues(bounds.lower, value);
  const upperComparison = compareIcebergValues(bounds.upper, value);
  if (lowerComparison === undefined || upperComparison === undefined) return true;
  if (operator === '=') return lowerComparison <= 0 && upperComparison >= 0;
  if (operator === '<>') return bounds.lower !== bounds.upper || lowerComparison !== 0;
  if (operator === '<') return lowerComparison < 0;
  if (operator === '<=') return lowerComparison <= 0;
  if (operator === '>') return upperComparison > 0;
  return upperComparison >= 0;
}

/** Compares manifest-bound values when their JavaScript representations are safely compatible. */
function compareIcebergValues(left: unknown, right: unknown): number | undefined {
  if (left instanceof Uint8Array || right instanceof Uint8Array) return undefined;
  if (left instanceof Date || right instanceof Date) {
    if (!(left instanceof Date) || !(right instanceof Date)) return undefined;
    return left.getTime() - right.getTime();
  }
  const numeric =
    (typeof left === 'number' || typeof left === 'bigint') &&
    (typeof right === 'number' || typeof right === 'bigint');
  if (!numeric && typeof left !== typeof right) return undefined;
  if (!['string', 'number', 'bigint', 'boolean'].includes(typeof left)) return undefined;
  if (!['string', 'number', 'bigint', 'boolean'].includes(typeof right)) return undefined;
  const comparableLeft = left as string | number | bigint | boolean;
  const comparableRight = right as string | number | bigint | boolean;
  return comparableLeft < comparableRight ? -1 : comparableLeft > comparableRight ? 1 : 0;
}

function isDataManifest(manifest: IcebergManifestFile): boolean {
  return manifest.content === undefined || manifest.content === 0 || manifest.content === 'data';
}

/** Identifies delete manifests without depending on a particular Iceberg version. */
function isDeleteManifest(manifest: IcebergManifestFile): boolean {
  return manifest.content === 1 || manifest.content === 'deletes' || manifest.content === 'delete';
}

/** Creates a Parquet data-file plan from an Iceberg manifest entry. */
function createIcebergParquetFile(
  baseLocation: string,
  dataFile: IcebergDataFile,
  manifest: IcebergManifestFile,
  snapshotId: number,
  schemaId: number | undefined
): IcebergParquetFile {
  return {
    data: resolveIcebergLocation(baseLocation, dataFile.file_path),
    fileSize: dataFile.file_size_in_bytes,
    recordCount: dataFile.record_count,
    partition: normalizeIcebergMap(dataFile.partition),
    lowerBounds: normalizeIcebergMap(dataFile.lower_bounds),
    upperBounds: normalizeIcebergMap(dataFile.upper_bounds),
    manifestPath: manifest.manifest_path,
    partitionSpecId: manifest.partition_spec_id,
    snapshotId,
    schemaId,
    dataSequenceNumber:
      dataFile.data_sequence_number ??
      (getIcebergRecordValue(dataFile, 'data_sequence_number') as number | undefined)
  };
}

/** Creates a delete-file plan while retaining only metadata needed by a future delete reader. */
function createIcebergDeleteFile(
  baseLocation: string,
  dataFile: IcebergDataFile,
  manifest: IcebergManifestFile,
  snapshotId: number,
  schemaId: number | undefined
): IcebergDeleteFile {
  return {
    data: resolveIcebergLocation(baseLocation, dataFile.file_path),
    format: dataFile.file_format,
    content: dataFile.content ?? manifest.content,
    referencedDataFile:
      typeof dataFile.referenced_data_file === 'string'
        ? resolveIcebergLocation(baseLocation, dataFile.referenced_data_file)
        : undefined,
    equalityFieldIds: normalizeNumberArray(
      getIcebergRecordValue(dataFile, 'equality_ids') ??
        getIcebergRecordValue(dataFile, 'equality-ids')
    ),
    fileSize: dataFile.file_size_in_bytes,
    recordCount: dataFile.record_count,
    partition: normalizeIcebergMap(dataFile.partition),
    manifestPath: manifest.manifest_path,
    partitionSpecId: manifest.partition_spec_id,
    snapshotId,
    schemaId,
    dataSequenceNumber:
      dataFile.data_sequence_number ??
      (getIcebergRecordValue(dataFile, 'data_sequence_number') as number | undefined)
  };
}

function isDeletedManifestEntry(entry: Record<string, unknown>): boolean {
  return entry.status === 2 || entry.status === 'deleted' || entry.status === 'DELETE';
}

function resolveIcebergLocation(baseLocation: string, childLocation: string): string {
  if (/^(?:s3a?):\/\//i.test(childLocation)) return resolveS3Location(childLocation);
  if (/^[a-z][a-z\d+.-]*:/i.test(childLocation)) return childLocation;
  try {
    const baseUrl = new URL(baseLocation.endsWith('/') ? baseLocation : `${baseLocation}/`);
    return normalizeS3Location(new URL(childLocation, baseUrl).toString());
  } catch {
    return normalizeS3Location(
      `${baseLocation.replace(/\/+$/, '')}/${childLocation.replace(/^\/+/, '')}`
    );
  }
}

/** Maps S3 URI forms used in table metadata to browser-fetchable virtual-host-neutral URLs. */
function normalizeS3Location(location: string): string {
  return /^(?:s3a?):\/\//i.test(location) ? resolveS3Location(location) : location;
}

/** Resolves an S3 or S3A URI through the anonymous S3 HTTPS endpoint. */
function resolveS3Location(location: string): string {
  const match = location.match(/^s3a?:\/\/([^/]+)\/(.*)$/i);
  if (!match) return location;
  return `https://s3.amazonaws.com/${match[1]}/${match[2]}`;
}

function validateIcebergTableMetadata(metadata: IcebergTableMetadata): void {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Iceberg metadata must be a JSON object');
  }
  if (![1, 2, 3].includes(metadata['format-version'])) {
    throw new Error(
      `Unsupported Iceberg metadata format version: ${String(metadata['format-version'])}`
    );
  }
  if (typeof metadata.location !== 'string' || metadata.location.length === 0) {
    throw new Error('Iceberg metadata location must be a non-empty string');
  }
  if (metadata.snapshots !== undefined && !Array.isArray(metadata.snapshots)) {
    throw new Error('Iceberg metadata snapshots must be an array');
  }
}

function combineAbortSignals(
  signal: AbortSignal | undefined,
  closeSignal: AbortSignal,
  controller: AbortController
): {signal: AbortSignal; dispose: () => void} {
  const signals = [signal, closeSignal].filter((candidate): candidate is AbortSignal =>
    Boolean(candidate)
  );
  const abort = () => controller.abort();
  for (const candidate of signals) {
    if (candidate.aborted) controller.abort();
    else candidate.addEventListener('abort', abort, {once: true});
  }
  return {
    signal: controller.signal,
    dispose: () => signals.forEach(candidate => candidate.removeEventListener('abort', abort))
  };
}
