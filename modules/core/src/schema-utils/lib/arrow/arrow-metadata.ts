// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {mergeArrowSchemas, snapshotArrowSchema} from '@math.gl/core/arrow';

export {mergeArrowSchemas, snapshotArrowSchema};

/** Creates a native batch with a metadata map on Arrow releases that lack one. */
export function makeArrowRecordBatch(
  schema: arrow.Schema,
  data?: arrow.RecordBatch['data'],
  metadata?: ReadonlyMap<string, string>
): arrow.RecordBatch {
  const batch = new arrow.RecordBatch(schema, data);
  // Older supported Arrow versions reject the metadata constructor argument.
  if (!batch.metadata) {
    Object.defineProperty(batch, 'metadata', {value: new Map<string, string>()});
  }
  for (const [key, value] of metadata ?? []) {
    batch.metadata.set(key, value);
  }
  // Arrow derives Struct length from its children, which are absent in zero-column batches.
  if (data && !schema.fields.length && batch.numRows !== data.length) {
    Object.defineProperty(batch, 'data', {value: data});
  }
  return batch;
}

/** Snapshots a batch's schema and metadata while retaining its data buffers and row count. */
function snapshotArrowBatch(batch: arrow.RecordBatch, schema: arrow.Schema): arrow.RecordBatch {
  return makeArrowRecordBatch(snapshotArrowSchema(schema), batch.data, batch.metadata);
}

/** Applies a table schema snapshot to its batches while retaining batch-local custom metadata. */
export function updateArrowTableSchema(table: arrow.Table, schema: arrow.Schema): arrow.Table {
  const snapshot = snapshotArrowSchema(schema);
  const batches = table.batches.map(batch => snapshotArrowBatch(batch, snapshot));
  // Preserve declared schemas even for schema-only empty tables.
  return new arrow.Table(snapshot, batches.length ? batches : [makeArrowMetadataBatch(snapshot)]);
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

/** Creates a zero-row metadata update retaining the complete declared schema. */
export function makeArrowMetadataBatch(schema: arrow.Schema): arrow.RecordBatch {
  return makeArrowRecordBatch(snapshotArrowSchema(schema));
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
