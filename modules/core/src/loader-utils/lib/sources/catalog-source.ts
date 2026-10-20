// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Common feature declarations for discoverable resource catalogs. */
export type CatalogSourceCapabilities = Readonly<{
  /** Catalog records can be queried. */
  search: boolean;
  /** Search results can be consumed across multiple result pages. */
  pagination: boolean;
  /** The catalog exposes parent/child traversal. */
  hierarchy: boolean;
  /** Search accepts a spatial constraint. */
  spatialFilter: boolean;
  /** Search accepts a temporal constraint. */
  temporalFilter: boolean;
  /** Search accepts a free-text constraint. */
  textFilter: boolean;
  /** Search accepts a CQL2 filter. */
  cql2Filter: boolean;
  /** The catalog exposes named collections. */
  collections: boolean;
  /** Records can describe downloadable or streamable assets. */
  assets: boolean;
}>;

/**
 * Minimal shared interface for catalog protocols such as STAC and OGC CSW.
 *
 * Protocol-specific sources retain their richer methods and record models. This interface only
 * standardizes capability discovery, catalog metadata, and asynchronous record search.
 */
export interface CatalogSource<RecordT, QueryT = undefined, MetadataT = unknown> {
  /** Features implemented by this catalog source. */
  readonly capabilities: CatalogSourceCapabilities;

  /** Returns protocol-specific catalog metadata. */
  getMetadata(): Promise<MetadataT>;

  /** Searches catalog records, following protocol pagination when supported. */
  search(query?: QueryT): AsyncIterable<RecordT>;
}
