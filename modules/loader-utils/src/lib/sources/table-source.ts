import type {Schema, TableBatch} from '@loaders.gl/schema';
import type {TableQueryOptions} from '../scan-utils/table-query';

/** Metadata returned by a table source before rows are consumed. */
export type TableQueryMetadata = Readonly<{
  schema?: Schema;
  rowCount?: number;
  capabilities: Readonly<{
    predicate: boolean;
    projection: boolean;
    limit: boolean;
  }>;
}>;

/** Minimal source contract for streaming table data. */
export interface TableScanSource<BatchT extends TableBatch = TableBatch> {
  /** Discovers schema and source capabilities without consuming query output. */
  getQueryMetadata(options?: TableQueryOptions): Promise<TableQueryMetadata>;
  /** Produces ordered table batches and applies the supplied query options. */
  scan(options?: TableQueryOptions): AsyncIterable<BatchT>;
}

/** Function used by {@link LinearTableSource} to decode a byte stream. */
export type TableBatchParser<OptionsT> = (
  chunks: AsyncIterable<ArrayBufferLike | ArrayBufferView>,
  options?: OptionsT
) => AsyncIterable<TableBatch>;

/** Base class for forward-only, non-indexed table sources such as CSV and NDJSON. */
export abstract class LinearTableSource<OptionsT = unknown> implements TableScanSource {
  /** Creates a source around format-specific options. */
  constructor(protected readonly sourceOptions: OptionsT) {}

  /** Returns metadata for this linear source. */
  abstract getQueryMetadata(options?: TableQueryOptions): Promise<TableQueryMetadata>;

  /** Produces batches in source order. */
  abstract scan(options?: TableQueryOptions): AsyncIterable<TableBatch>;
}
