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

/** Applies a table schema snapshot to its batches while retaining batch-local custom metadata. */
export function updateArrowTableSchema(table: arrow.Table, schema: arrow.Schema): arrow.Table {
  const snapshot = snapshotArrowSchema(schema);
  const batches = table.batches.map(
    batch =>
      new arrow.RecordBatch(snapshotArrowSchema(snapshot), batch.data, new Map(batch.metadata))
  );
  // Preserve declared schemas even for schema-only empty tables.
  return new arrow.Table(
    snapshot,
    batches.length ? batches : [new arrow.RecordBatch(snapshotArrowSchema(snapshot), undefined)]
  );
}

/** Updates an Arrow wrapper and its underlying table together without mutating either input. */
export function updateArrowTableMetadata<T extends ArrowTable>(
  table: T,
  metadata: Record<string, string>
): T {
  const schema = new arrow.Schema(
    table.data.schema.fields,
    new Map([...table.data.schema.metadata, ...Object.entries(metadata)])
  );
  const data = updateArrowTableSchema(table.data, schema);
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
    collected.push(
      new arrow.RecordBatch(snapshotArrowSchema(batch.schema), batch.data, new Map(batch.metadata))
    );
  }
  return schema ? new arrow.Table(schema, collected) : null;
}

/** Refines Arrow wrapper schemas and cumulative bounds while passing non-Arrow outputs through. */
export async function* refineArrowTableBatches<T>(
  batches: AsyncIterable<T> | Iterable<T>
): AsyncIterable<T> {
  let schema: arrow.Schema | undefined;
  let bounds: number[][] | undefined;
  for await (const batch of batches) {
    const table = batch as T & ArrowTable;
    if (table?.shape !== 'arrow-table') {
      yield batch;
      continue;
    }
    const localBounds = table.data.schema.metadata.get('boundingBox');
    const nextSchema = snapshotArrowSchema(table.data.schema);
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
    const data = updateArrowTableSchema(table.data, schema);
    if (localBounds) {
      for (const recordBatch of data.batches) recordBatch.metadata.set('boundingBox', localBounds);
    }
    yield {...table, data, schema: serializeArrowSchema(data.schema)} as Awaited<T>;
  }
}
