// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/core/schema';
import type {TableScanSource} from '../scan-utils/scan-query-metadata';

/** Source exposing named tables. Returned handles remain owned by the source or caller. */
export interface TableSourceCollection {
  /** Resolves one table without loading unrelated tables. */
  getTable(
    name: string,
    options?: {signal?: AbortSignal}
  ): ArrowTable | TableScanSource | Promise<ArrowTable | TableScanSource>;
}
