// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A four- or six-dimensional STAC bounding box. */
export type STACBoundingBox =
  | readonly [number, number, number, number]
  | readonly [number, number, number, number, number, number];

/** Hypermedia link shared by STAC catalogs, collections, items, and API responses. */
export type STACLink = {
  /** Link relation such as `self`, `child`, `item`, `next`, or `search`. */
  rel: string;
  /** Absolute or document-relative target URL. */
  href: string;
  /** Optional media type of the target. */
  type?: string;
  /** Human-readable link title. */
  title?: string;
  /** HTTP method declared by STAC API pagination links. */
  method?: 'GET' | 'POST';
  /** Optional request headers declared by a STAC API link. */
  headers?: Record<string, string>;
  /** Optional request body declared by a STAC API link. */
  body?: Record<string, unknown>;
  /** Whether a pagination body is merged with the previous request body. */
  merge?: boolean;
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** Downloadable or streamable resource described by one STAC Item. */
export type STACAsset = {
  /** Absolute or document-relative asset URL. */
  href: string;
  /** Human-readable asset title. */
  title?: string;
  /** Human-readable asset description. */
  description?: string;
  /** Asset media type. */
  type?: string;
  /** Semantic roles such as `data`, `thumbnail`, or `metadata`. */
  roles?: string[];
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** Root object for a static STAC Catalog or STAC API. */
export type STACCatalog = {
  /** STAC object discriminator. */
  type: 'Catalog';
  /** STAC specification version implemented by this object. */
  stac_version: string;
  /** STAC extension schema URLs. */
  stac_extensions?: string[];
  /** Catalog identifier. */
  id: string;
  /** Human-readable title. */
  title?: string;
  /** Human-readable description. */
  description: string;
  /** Hypermedia links. */
  links: STACLink[];
  /** STAC API conformance declaration URLs. */
  conformsTo?: string[];
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** Spatial and temporal extent of a STAC Collection. */
export type STACExtent = {
  /** Collection spatial extents. */
  spatial: {bbox: STACBoundingBox[]};
  /** Collection temporal intervals. */
  temporal: {interval: Array<readonly [string | null, string | null]>};
};

/** STAC Collection describing a related set of Items. */
export type STACCollection = {
  /** STAC object discriminator. */
  type: 'Collection';
  /** STAC specification version implemented by this object. */
  stac_version: string;
  /** STAC extension schema URLs. */
  stac_extensions?: string[];
  /** Collection identifier. */
  id: string;
  /** Human-readable title. */
  title?: string;
  /** Human-readable description. */
  description: string;
  /** Hypermedia links. */
  links: STACLink[];
  /** STAC API conformance declaration URLs. */
  conformsTo?: string[];
  /** SPDX identifier or `proprietary`/`various`. */
  license: string;
  /** Collection spatial and temporal extent. */
  extent: STACExtent;
  /** Collection-level assets. */
  assets?: Record<string, STACAsset>;
  /** Summary values for Item properties. */
  summaries?: Record<string, unknown>;
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** GeoJSON geometry carried by a STAC Item. */
export type STACGeometry = {
  /** GeoJSON geometry type. */
  type: string;
  /** GeoJSON coordinates. */
  coordinates?: unknown;
  /** Child geometries for a GeometryCollection. */
  geometries?: STACGeometry[];
  /** GeoJSON extension fields. */
  [key: string]: unknown;
};

/** One spatiotemporal record and its assets. */
export type STACItem = {
  /** GeoJSON feature discriminator. */
  type: 'Feature';
  /** STAC specification version implemented by this object. */
  stac_version: string;
  /** STAC extension schema URLs. */
  stac_extensions?: string[];
  /** Item identifier. */
  id: string;
  /** Item geometry, or `null` when unavailable. */
  geometry: STACGeometry | null;
  /** Item bounding box. */
  bbox?: STACBoundingBox;
  /** Item properties, including `datetime` or start/end datetimes. */
  properties: Record<string, unknown> & {
    datetime?: string | null;
    start_datetime?: string;
    end_datetime?: string;
  };
  /** Collection identifier. */
  collection?: string;
  /** Hypermedia links. */
  links: STACLink[];
  /** Assets keyed by application-defined names. */
  assets: Record<string, STACAsset>;
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** Paginated STAC API search response. */
export type STACItemCollection = {
  /** GeoJSON collection discriminator. */
  type: 'FeatureCollection';
  /** Items in this result page. */
  features: STACItem[];
  /** Pagination and related links. */
  links: STACLink[];
  /** Total matching Items when reported by the API. */
  numberMatched?: number;
  /** Items returned in this response when reported by the API. */
  numberReturned?: number;
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** Response returned by a STAC API Collections endpoint. */
export type STACCollections = {
  /** Collections in this result page. */
  collections: STACCollection[];
  /** Pagination and related links. */
  links: STACLink[];
  /** STAC extension fields. */
  [key: string]: unknown;
};

/** Any core STAC document understood by `STACSource`. */
export type STACObject = STACCatalog | STACCollection | STACItem | STACItemCollection;

/** Protocol mode discovered from the root STAC document. */
export type STACMode = 'static' | 'api';

/** Metadata returned by `STACSource.getMetadata()`. */
export type STACSourceMetadata = {
  /** Root Catalog or Collection. */
  root: STACCatalog | STACCollection;
  /** Whether this source exposes a STAC API search endpoint. */
  mode: STACMode;
  /** Declared API conformance classes. */
  conformsTo: readonly string[];
};

/** Standard STAC API Item Search parameters supported without extensions. */
export type STACSearchQuery = {
  /** Item identifiers to match. */
  ids?: readonly string[];
  /** Collection identifiers to match. */
  collections?: readonly string[];
  /** Spatial intersection bounding box. */
  bbox?: STACBoundingBox;
  /** RFC 3339 datetime or closed/open interval. */
  datetime?: string;
  /** Maximum Items requested per API response. */
  limit?: number;
  /** Abort this search and its pagination requests. */
  signal?: AbortSignal;
};

/** Explicit traversal limits for linked static STAC catalogs. */
export type STACTraversalOptions = STACSearchQuery & {
  /** Maximum child-catalog depth below the root. */
  maxDepth?: number;
  /** Maximum number of STAC documents fetched. */
  maxRequests?: number;
};

/** Selects assets from one STAC Item. */
export type STACAssetSelection = {
  /** Require at least one matching asset role. */
  roles?: readonly string[];
  /** Require an exact media type. */
  mediaTypes?: readonly string[];
};

/** Asset with its Item key and an absolute URL. */
export type STACResolvedAsset = STACAsset & {
  /** Key of the asset in the Item. */
  key: string;
  /** Absolute asset URL resolved against its containing STAC document. */
  href: string;
};
