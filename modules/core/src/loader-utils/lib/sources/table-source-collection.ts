// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, Schema} from '@loaders.gl/core/schema';
import type {TableScanSource} from '../scan-utils/scan-query-metadata';

/** Source exposing named tables. Returned handles remain owned by the source or caller. */
export interface TableSourceCollection {
  /** Resolves one table without loading unrelated tables. */
  getTable(
    name: string,
    options?: {signal?: AbortSignal}
  ): ArrowTable | TableScanSource | Promise<ArrowTable | TableScanSource>;
}

/** Metadata for one named table without reading its result rows. */
export type TableMetadata = Readonly<{
  /** Unique loaded table name within its parent source. */
  name: string;
  /** Already available schema; table listings may omit it for lazy discovery. */
  schema?: Schema;
  /** Whether the source exposes this table through the common query contract. */
  queryable?: boolean;
}>;

/** Metadata-only discovery implemented by sources exposing multiple tables. */
export interface TableDiscoverySource {
  /** Lists table names without opening their row readers. */
  getTablesMetadata(options?: {
    signal?: AbortSignal;
  }): readonly TableMetadata[] | Promise<readonly TableMetadata[]>;
  /** Discovers one table schema without materializing its rows. */
  getTableMetadata?(
    name: string,
    options?: {signal?: AbortSignal}
  ): TableMetadata | Promise<TableMetadata>;
}
