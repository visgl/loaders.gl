// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';
import type {DataType, Schema} from '@loaders.gl/schema';
import {
  deserializeArrowSchema,
  deserializeArrowType,
  serializeArrowSchema,
  serializeArrowType
} from '@loaders.gl/schema-utils';
import {splitArrowBuffers, type SplitArrowBuffersOptions} from './split-arrow-buffers';

/** Structured-cloneable Arrow Data payload used by dehydrateArrowTable. */
export type DehydratedArrowData<T extends arrow.DataType = arrow.DataType> = {
  type: DataType;
  offset: number;
  length: number;
  nullCount: number;
  buffers: Partial<Buffers<T>>;
  children: DehydratedArrowData[];
  dictionary?: DehydratedArrowVector;
};

/** Structured-cloneable Arrow Vector payload used by dehydrateArrowTable. */
export type DehydratedArrowVector<T extends arrow.DataType = arrow.DataType> = {
  data: DehydratedArrowData<T>[];
};

/** Structured-cloneable Arrow RecordBatch payload used by dehydrateArrowTable. */
export type DehydratedArrowRecordBatch<T extends arrow.TypeMap = arrow.TypeMap> = {
  data: DehydratedArrowData<arrow.Struct<T>>;
};

/** Structured-cloneable Arrow Table payload for same-version Arrow JS boundaries. */
export type DehydratedArrowTable<T extends arrow.TypeMap = arrow.TypeMap> = {
  shape: 'arrow-table';
  transport: 'arrow-js';
  schema: Schema;
  batches: DehydratedArrowRecordBatch<T>[];
};

/** Arrow IPC payload for robust Arrow table transport across Arrow JS versions. */
export type SerializedArrowTableIPC = {
  shape: 'arrow-table';
  transport: 'arrow-ipc';
  data: Uint8Array;
};

/**
 * Dehydrates an Arrow table into a structured-cloneable payload.
 *
 * This format preserves Arrow JS object details and is efficient, but assumes both sides hydrate
 * with a compatible Apache Arrow JS version. Use serializeArrowTableToIPC when crossing version
 * boundaries. Arrow schema and type metadata are serialized with @loaders.gl/schema-utils helpers.
 * @param table Arrow table to dehydrate.
 * @param options Buffer splitting options.
 * @returns Structured-cloneable Arrow table payload.
 */
export function dehydrateArrowTable<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  options?: SplitArrowBuffersOptions
): DehydratedArrowTable<T> {
  const splitTable = splitArrowBuffers(table, options);
  return {
    shape: 'arrow-table',
    transport: 'arrow-js',
    schema: serializeArrowSchema(splitTable.schema),
    batches: splitTable.batches.map(recordBatch => dehydrateArrowRecordBatch(recordBatch))
  };
}

/**
 * Hydrates a table payload created by dehydrateArrowTable into a real Arrow table.
 * @param table Structured-cloneable Arrow table payload.
 * @returns Hydrated Arrow table.
 */
export function hydrateArrowTable<T extends arrow.TypeMap>(
  table: DehydratedArrowTable<T>
): arrow.Table<T> {
  const schema = deserializeArrowSchema(table.schema) as arrow.Schema<T>;
  const recordBatches = table.batches.map(
    recordBatch => new arrow.RecordBatch(schema, hydrateArrowData(recordBatch.data))
  );
  return new arrow.Table(schema, recordBatches);
}

/**
 * Serializes an Arrow table to Arrow IPC bytes.
 *
 * This is less efficient than dehydrateArrowTable for in-memory worker hops, but it is more robust
 * when the producer and consumer may use different Apache Arrow JS versions.
 * @param table Arrow table to serialize.
 * @returns Arrow IPC payload.
 */
export function serializeArrowTableToIPC(table: arrow.Table): SerializedArrowTableIPC {
  return {
    shape: 'arrow-table',
    transport: 'arrow-ipc',
    data: arrow.tableToIPC(table)
  };
}

/**
 * Deserializes Arrow IPC bytes from serializeArrowTableToIPC into a real Arrow table.
 * @param table Serialized Arrow table payload or raw IPC bytes.
 * @returns Deserialized Arrow table.
 */
export function deserializeArrowTableFromIPC(
  table: SerializedArrowTableIPC | ArrayBuffer | Uint8Array
): arrow.Table {
  const data = isSerializedArrowTableIPC(table) ? table.data : table;
  return arrow.tableFromIPC(data);
}

/**
 * Dehydrates an Arrow record batch into a structured-cloneable payload.
 * @param recordBatch Arrow record batch to dehydrate.
 * @returns Structured-cloneable record batch payload.
 */
function dehydrateArrowRecordBatch<T extends arrow.TypeMap>(
  recordBatch: arrow.RecordBatch<T>
): DehydratedArrowRecordBatch<T> {
  return {data: dehydrateArrowData(recordBatch.data)};
}

/**
 * Dehydrates an Arrow data node into a structured-cloneable payload.
 * @param data Arrow data node to dehydrate.
 * @returns Structured-cloneable data payload.
 */
function dehydrateArrowData<T extends arrow.DataType>(data: arrow.Data<T>): DehydratedArrowData<T> {
  return {
    type: serializeArrowType(data.type),
    offset: data.offset,
    length: data.length,
    // @ts-expect-error _nullCount is protected. Preserve the Arrow lazy null-count state.
    nullCount: data._nullCount,
    buffers: {
      [arrow.BufferType.OFFSET]: data.buffers[arrow.BufferType.OFFSET],
      [arrow.BufferType.DATA]: data.buffers[arrow.BufferType.DATA],
      [arrow.BufferType.VALIDITY]: data.buffers[arrow.BufferType.VALIDITY],
      [arrow.BufferType.TYPE]: data.buffers[arrow.BufferType.TYPE]
    },
    children: data.children.map(childData => dehydrateArrowData(childData)),
    dictionary: data.dictionary ? dehydrateArrowVector(data.dictionary) : undefined
  };
}

/**
 * Dehydrates an Arrow vector into a structured-cloneable payload.
 * @param vector Arrow vector to dehydrate.
 * @returns Structured-cloneable vector payload.
 */
function dehydrateArrowVector<T extends arrow.DataType>(
  vector: arrow.Vector<T>
): DehydratedArrowVector<T> {
  return {data: vector.data.map(data => dehydrateArrowData(data))};
}

/**
 * Hydrates an Arrow data payload into a real Arrow data node.
 * @param data Structured-cloneable data payload.
 * @returns Hydrated Arrow data node.
 */
function hydrateArrowData<T extends arrow.DataType>(data: DehydratedArrowData<T>): arrow.Data<T> {
  const children = data.children.map(childData => hydrateArrowData(childData));
  const dictionary = data.dictionary ? hydrateArrowVector(data.dictionary) : undefined;
  return new arrow.Data(
    deserializeArrowType(data.type) as T,
    data.offset,
    data.length,
    data.nullCount,
    data.buffers,
    children,
    dictionary
  );
}

/**
 * Hydrates an Arrow vector payload into a real Arrow vector.
 * @param vector Structured-cloneable vector payload.
 * @returns Hydrated Arrow vector.
 */
function hydrateArrowVector<T extends arrow.DataType>(
  vector: DehydratedArrowVector<T>
): arrow.Vector<T> {
  return new arrow.Vector(vector.data.map(data => hydrateArrowData(data)));
}

/**
 * Tests whether a value is a serialized Arrow table payload.
 * @param value Value to test.
 * @returns True when the value is a SerializedArrowTableIPC.
 */
function isSerializedArrowTableIPC(value: unknown): value is SerializedArrowTableIPC {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as SerializedArrowTableIPC).shape === 'arrow-table' &&
      (value as SerializedArrowTableIPC).transport === 'arrow-ipc'
  );
}
