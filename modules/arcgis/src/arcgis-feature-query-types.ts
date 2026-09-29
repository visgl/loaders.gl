// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTable} from '@loaders.gl/schema';
import type {GetFeaturesParameters} from '@loaders.gl/loader-utils';
import type {ArcGISFeatureServiceQueryOptions} from './arcgis-source-types';

/** Parameters shared by feature, table and MapServer layer queries. */
export type ArcGISFeatureQueryParameters = Partial<GetFeaturesParameters> & {
  /** Per-request filters, overriding source query defaults. */
  query?: ArcGISFeatureServiceQueryOptions;
};

/** Controls bounded retrieval of a complete query. */
export type ArcGISFeatureQueryOptions = ArcGISFeatureQueryParameters & {
  /** Maximum records per page, capped by the advertised service limit. Default 1000. */
  pageSize?: number;
  /** Maximum retained records. Default 100000; reaching it can produce an incomplete result. */
  maxFeatures?: number;
  /** Concurrent object-ID batches, between 1 and 8. Default 4; offset pages are serial. */
  concurrency?: number;
  /** Auto uses ordered pagination when advertised, otherwise object-ID batches. */
  strategy?: 'auto' | 'offset' | 'object-ids';
  /** Reports each yielded page, including the final completion assessment. */
  onProgress?: (progress: ArcGISFeatureQueryProgress) => void;
};

/** Completion evidence for the selected query, never a transactional snapshot guarantee. */
export type ArcGISFeatureQueryProgress = {
  /** Number of unique records retained so far. */
  loaded: number;
  /** Count observed before retrieval; absent for a single-page request. */
  expectedCount?: number;
  /** Number of data pages processed. */
  pages: number;
  /** Duplicate records discarded while retrieving pages. */
  duplicates: number;
  /** True only after traversal finishes and its unique count matches the initial server count. */
  complete: boolean;
  /** Whether the query includes a viewport bounding box. */
  scope: 'viewport' | 'query';
  /** Retrieval strategy used for this result. */
  strategy: 'offset' | 'object-ids' | 'page';
  /** Why retrieval is in progress, finished, or incomplete. */
  reason:
    | 'loading'
    | 'complete'
    | 'single-page'
    | 'feature-limit'
    | 'id-limit'
    | 'count-mismatch'
    | 'no-progress';
};

/** One page with cumulative progress, or the collected result of queryFeatures(). */
export type ArcGISFeatureQueryResult = ArcGISFeatureQueryProgress & {
  /** Spatial features or table records represented as features with null geometry. */
  data: GeoJSONTable;
};

/** Result of an IDs-only request; this alone does not prove query completeness. */
export type ArcGISFeatureObjectIds = {
  /** Stable object ID field advertised by the response. */
  objectIdFieldName: string;
  /** Unique safe-integer or string identifiers returned by the service. */
  objectIds: (number | string)[];
  /** True when the service explicitly reports truncated identifiers. */
  exceededTransferLimit: boolean;
};

/** Extent-only response, retaining the service's explicit spatial reference. */
export type ArcGISFeatureExtent = {
  /** Matching record count when supplied by the server. */
  count?: number;
  /** Null for an empty or nonspatial query. */
  extent: {
    /** Minimum x coordinate. */
    xmin: number;
    /** Minimum y coordinate. */
    ymin: number;
    /** Maximum x coordinate. */
    xmax: number;
    /** Maximum y coordinate. */
    ymax: number;
    /** Coordinate reference of the returned bounds. */
    spatialReference: {wkid?: number; latestWkid?: number; wkt?: string};
  } | null;
};
