---
title: STAC format
description: A catalog standard for discovering geospatial assets by space, time, collection, and links.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DatasetDiscoveryGraphic} from '@site/src/components/docs/dataset-discovery-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Dataset catalog format"
  title="Describe the asset before you download it."
  description="STAC connects catalog, collection, and item metadata to the files or services that carry the actual data. It adds spatial and temporal discovery without replacing the native format loader."
  tone="mint"
  meta={['Catalogs and Items', 'Space and time', 'Asset links']}
  links={[
    {label: 'STAC module', to: '/docs/modules/stac'},
    {label: 'STAC source API', to: '/docs/modules/stac/api-reference/stac-source-loader'}
  ]}
/>

<DatasetDiscoveryGraphic kind="stac" />

<DocOrientation
  eyebrow="Discovery before decoding"
  title="Find the item. Choose the asset. Decode it natively."
  description="STAC makes discovery portable while keeping parsing specialized. A selected asset can continue into a GeoTIFF, Parquet, Zarr, PMTiles, or other loaders.gl source without losing its catalog context."
  tone="mint"
  items={[
    {label: 'Catalog', value: 'Organizes collections and linked child documents'},
    {label: 'Search', value: 'Filters by collection, bbox, time, and extensions'},
    {label: 'Item', value: 'Describes one spatiotemporal asset or observation'},
    {label: 'Asset', value: 'Carries the media type, roles, and download link'}
  ]}
/>

The [SpatioTemporal Asset Catalog](https://stacspec.org/) specification describes geospatial assets
using JSON and GeoJSON documents connected by typed links. STAC metadata points to data; it does
not prescribe how a GeoTIFF, GeoParquet file, Zarr store, PMTiles archive, or other asset is decoded.

## Core objects

- A **Catalog** organizes child Catalogs and Collections.
- A **Collection** describes a related set of Items and their spatial and temporal extent.
- An **Item** is a GeoJSON Feature whose `assets` map identifies downloadable or streamable data.
- A **STAC API** adds HTTP discovery, Collections, Item Search, pagination, and optional extensions
  such as CQL2.

STAC extension fields are preserved by `@loaders.gl/stac` rather than discarded.

<ReferenceBoundary
  title="STAC objects and access modes"
  description="The sections below compare catalogs and APIs, explain composition with native format sources, and document browser access constraints."
  tone="mint"
/>

## Static catalogs and APIs

Static STAC and STAC API expose similar documents but have materially different query costs. A
STAC API evaluates search constraints on the server. A static catalog requires the client to follow
links and inspect Item metadata.

`STACSource.search()` therefore only invokes a discovered STAC API search relation.
`STACSource.traverse()` is the explicit, bounded operation for static catalogs.

## Composing catalogs and format sources

Catalog discovery and asset decoding are intentionally separate:

1. Open a catalog with `STACSourceLoader`.
2. Select an Item and a suitable data asset.
3. Open that asset with a format source such as `ParquetSourceLoader`, `GeoTIFFSourceLoader`, or
   `PMTilesSourceLoader`.

This keeps the STAC module small and lets each format source retain its own range planning,
predicate pushdown, worker, and caching behavior.

## CORS and random access

A public object URL is not necessarily browser-readable. Browser-native random access requires:

- a successful cross-origin `GET` or `HEAD` request;
- support for a single byte range with a `206 Partial Content` response;
- readable `Content-Range`, `Content-Length`, and preferably `ETag` or version headers.

When a STAC Item offers multiple mirrors, test the chosen asset host rather than assuming every
provider has the same CORS policy. In browser JavaScript, a CORS rejection is intentionally
indistinguishable from some network failures, so applications should present it as an inaccessible
asset and offer another mirror when available.
