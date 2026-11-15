// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Field, DataType, ArrowTable} from '@loaders.gl/core/schema';
import {serializeArrowSchema, deserializeArrowSchema} from '../schema/convert-arrow-schema';

/** Copies a schema, including nested field metadata, without retaining mutable metadata maps. */
export function snapshotArrowSchema(schema: arrow.Schema): arrow.Schema {
  return deserializeArrowSchema(serializeArrowSchema(schema));
}

/** Merges compatible schema snapshots, with later metadata values taking precedence. */
export function mergeArrowSchemas(
  previous: arrow.Schema | undefined,
  next: arrow.Schema
): arrow.Schema {
  if (!previous) return snapshotArrowSchema(next);
  // Arrow validates names, order, nullability and types, but intentionally ignores metadata.
  new arrow.Table(previous, [new arrow.RecordBatch(next, undefined)]);
  const earlier = serializeArrowSchema(previous);
  const later = serializeArrowSchema(next);
  return deserializeArrowSchema({
    ...later,
    fields: later.fields.map((field, index) => mergeFieldMetadata(earlier.fields[index], field)),
    metadata: {...earlier.metadata, ...later.metadata}
  });
}

/** Merges metadata recursively without changing a field's structural definition. */
function mergeFieldMetadata(previous: Field, next: Field): Field {
  return {
    ...next,
    type: mergeTypeMetadata(previous.type, next.type),
    metadata: {...previous.metadata, ...next.metadata}
  };
}

/** Preserves nested field metadata, including fields inside dictionary values. */
function mergeTypeMetadata(previous: DataType, next: DataType): DataType {
  if (typeof previous !== 'object' || typeof next !== 'object') return next;
  if ('children' in previous && 'children' in next) {
    const previousChildren = previous.children;
    return {
      ...next,
      children: next.children.map((field, index) =>
        mergeFieldMetadata(previousChildren[index], field)
      )
    };
  }
  if (previous.type === 'dictionary' && next.type === 'dictionary') {
    return {...next, dictionary: mergeTypeMetadata(previous.dictionary, next.dictionary)};
  }
  return next;
}

/** Snapshots a batch's schema and metadata while retaining its data buffers and row count. */
function snapshotArrowBatch(batch: arrow.RecordBatch, schema: arrow.Schema): arrow.RecordBatch {
  const snapshot = new arrow.RecordBatch(
    snapshotArrowSchema(schema),
    batch.data,
    new Map(batch.metadata)
  );
  // Arrow reconstructs the Struct length from its columns, which are absent in zero-column batches.
  if (snapshot.numRows !== batch.numRows) {
    Object.defineProperty(snapshot, 'data', {value: batch.data});
  }
  return snapshot;
}

/** Applies a table schema snapshot to its batches while retaining batch-local custom metadata. */
export function updateArrowTableSchema(table: arrow.Table, schema: arrow.Schema): arrow.Table {
  const snapshot = snapshotArrowSchema(schema);
  const batches = table.batches.map(batch => snapshotArrowBatch(batch, snapshot));
  // Preserve declared schemas even for schema-only empty tables.
  return new arrow.Table(
    snapshot,
    batches.length ? batches : [new arrow.RecordBatch(snapshotArrowSchema(snapshot), undefined)]
  );
}

/** Updates native Arrow metadata while preserving independent batch snapshots. */
export function updateNativeArrowTableMetadata(
  table: arrow.Table,
  metadata: Record<string, string>
): arrow.Table {
  const schema = new arrow.Schema(
    table.schema.fields,
    new Map([...table.schema.metadata, ...Object.entries(metadata)])
  );
  return updateArrowTableSchema(table, schema);
}

/** Updates an Arrow wrapper and its underlying table together without mutating either input. */
export function updateArrowTableMetadata<T extends ArrowTable>(
  table: T,
  metadata: Record<string, string>
): T {
  const data = updateNativeArrowTableMetadata(table.data, metadata);
  return {...table, data, schema: serializeArrowSchema(data.schema)};
}

/** Creates a zero-row metadata update retaining the complete declared schema. */
export function makeArrowMetadataBatch(schema: arrow.Schema): arrow.RecordBatch {
  return new arrow.RecordBatch(snapshotArrowSchema(schema), undefined);
}

/** Collects Arrow batches, retaining emission snapshots and merging final schema metadata. */
export async function makeArrowTableFromBatches(
  batches: AsyncIterable<arrow.RecordBatch> | Iterable<arrow.RecordBatch>
): Promise<arrow.Table | null> {
  let schema: arrow.Schema | undefined;
  const collected: arrow.RecordBatch[] = [];
  for await (const batch of batches) {
    schema = mergeArrowSchemas(schema, batch.schema);
    collected.push(snapshotArrowBatch(batch, batch.schema));
  }
  return schema ? new arrow.Table(schema, collected) : null;
}

/** Snapshots native Arrow schemas, accumulating bounds and retaining local batch bounds. */
export async function* refineArrowTableBatches(
  batches: AsyncIterable<arrow.Table> | Iterable<arrow.Table>
): AsyncIterable<arrow.Table> {
  let schema: arrow.Schema | undefined;
  let bounds: number[][] | undefined;
  for await (const table of batches) {
    const localBounds = table.schema.metadata.get('boundingBox');
    const nextSchema = snapshotArrowSchema(table.schema);
    if (localBounds) {
      const nextBounds = JSON.parse(localBounds) as number[][];
      bounds = bounds
        ? [
            nextBounds[0].map((value, index) => Math.min(bounds![0][index], value)),
            nextBounds[1].map((value, index) => Math.max(bounds![1][index], value))
          ]
        : nextBounds;
      nextSchema.metadata.set('boundingBox', JSON.stringify(bounds));
    }
    schema = mergeArrowSchemas(schema, nextSchema);
    const data = updateArrowTableSchema(table, schema);
    if (localBounds) {
      for (const recordBatch of data.batches) recordBatch.metadata.set('boundingBox', localBounds);
    }
    yield data;
  }
}
