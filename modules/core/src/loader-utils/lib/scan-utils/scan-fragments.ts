// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableScanReadOptions} from './scan-query-metadata';
import type {ColumnarPredicate, ColumnarPredicateProperty} from './columnar-predicate';

/** A catalog-independent fragment selected before format-specific decoding. */
export type ScanFragment = Readonly<{
  /** Stable identifier for the fragment or data file. */
  id: string;
  /** URI or opaque source handle used by the physical executor. */
  uri?: string;
  /** Partition values available for early query pruning. */
  partitionValues?: Readonly<Record<string, unknown>>;
  /** Approximate physical size, when supplied by the catalog. */
  byteLength?: number | bigint;
  /** Approximate row count, when supplied by the catalog. */
  rowCount?: number | bigint;
  /** Format- or catalog-specific metadata retained for explain/provenance output. */
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Provider contract for catalog or manifest layers that select physical scan fragments. */
export type ScanFragmentProvider<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate<
    unknown,
    ColumnarPredicateProperty
  >
> = {
  /** Discovers fragments without opening their data pages. */
  getScanFragments(options?: TableScanReadOptions<PredicateT>): Promise<readonly ScanFragment[]>;
};
