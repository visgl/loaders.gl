// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, RecordBatch} from 'apache-arrow';
import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
} from '@loaders.gl/core/schema-utils/arrow-transport';

/** Transfers each logical trace table through the shared owned Arrow column transport. */
export function serializeTraceWorkerResult(result: any): unknown {
  if (result instanceof Table)
    return serializeArrowWorkerTable({shape: 'arrow-table', data: result});
  return {
    transport: 'trace-tables',
    tables: Object.fromEntries(
      Object.entries(result).map(([name, table]) => [
        name,
        serializeArrowWorkerTable({shape: 'arrow-table', data: table})
      ])
    )
  };
}

/** Hydrates the original trace table collection, preserving Arrow schemas and bigint columns. */
export function deserializeTraceWorkerResult(result: any): any {
  if (result?.shape === 'arrow-table') return deserializeArrowWorkerTable(result).data;
  if (result?.transport !== 'trace-tables')
    throw new Error('Trace workers require Arrow column transport');
  return Object.fromEntries(
    Object.entries(result.tables).map(([name, table]) => [
      name,
      deserializeArrowWorkerTable(table).data
    ])
  );
}

/** Copies record-batch columns before transfer so a continuing parser retains its buffers. */
export function serializeTraceWorkerBatch(result: any): unknown {
  const batch = result instanceof RecordBatch ? result : result.data;
  if (!(batch instanceof RecordBatch))
    throw new Error('Trace workers require Arrow record batches');
  return {
    table: result instanceof RecordBatch ? undefined : result.table,
    columns: serializeArrowWorkerTable({
      shape: 'arrow-table',
      data: new Table(batch.schema, [batch])
    })
  };
}

/** Restores a real Arrow record batch and its optional logical-table tag on the caller. */
export function deserializeTraceWorkerBatch(result: any): any {
  const table = deserializeArrowWorkerTable(result?.columns).data as Table;
  if (table.batches.length !== 1)
    throw new Error('Trace worker batches require one Arrow record batch');
  return result.table === undefined
    ? table.batches[0]
    : {table: result.table, data: table.batches[0]};
}
