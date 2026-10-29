Dataset catalog format

# STAC

STAC connects catalog, collection, and item metadata to the files or services that carry the actual data. It adds spatial and temporal discovery without replacing the native format loader.

[STAC module](https://loaders.gl/next/docs/modules/ogc/stac.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/stac.md)[STAC source API](https://loaders.gl/next/docs/modules/ogc/stac/api-reference/stac-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/stac/api-reference/stac-source-loader.md)

Catalog discovery

## Find the asset before opening the bytes.

STAC narrows a dataset by space, time, collection, and links. Once an asset is selected, its native loaders.gl source can handle the actual data.

01

### Catalog or API

collections · search

spacetime

the&#x6E;**→**

02

### STAC item

one spatiotemporal record

extentcontext

the&#x6E;**→**

03

### Asset link

role · media type · URL

chooseinspect

the&#x6E;**→**

04

### Native loader

Parquet · GeoTIFF · Zarr

decodescan

STAC describes where the data is and what it means; the format loader remains responsible for decoding it.

Discovery before decoding

## Find the item. Choose the asset. Decode it natively.

STAC makes discovery portable while keeping parsing specialized. A selected asset can continue into a GeoTIFF, Parquet, Zarr, PMTiles, or other loaders.gl source without losing its catalog context.

01

Catalog

Organizes collections and linked child documents

02

Search

Filters by collection, bbox, time, and extensions

03

Item

Describes one spatiotemporal asset or observation

04

Asset

Carries the media type, roles, and download link

The [SpatioTemporal Asset Catalog](https://stacspec.org/) specification describes geospatial assets using JSON and GeoJSON documents connected by typed links. STAC metadata points to data; it does not prescribe how a GeoTIFF, GeoParquet file, Zarr store, PMTiles archive, or other asset is decoded.

## Core objects[​](#core-objects "Direct link to Core objects")

* A **Catalog** organizes child Catalogs and Collections.
* A **Collection** describes a related set of Items and their spatial and temporal extent.
* An **Item** is a GeoJSON Feature whose `assets` map identifies downloadable or streamable data.
* A **STAC API** adds HTTP discovery, Collections, Item Search, pagination, and optional extensions such as CQL2.

STAC extension fields are preserved by `@loaders.gl/ogc/stac` rather than discarded.

Detailed guide

## STAC objects and access modes

The sections below compare catalogs and APIs, explain composition with native format sources, and document browser access constraints.

## Static catalogs and APIs[​](#static-catalogs-and-apis "Direct link to Static catalogs and APIs")

Static STAC and STAC API expose similar documents but have materially different query costs. A STAC API evaluates search constraints on the server. A static catalog requires the client to follow links and inspect Item metadata.

`STACSource.search()` therefore only invokes a discovered STAC API search relation. `STACSource.traverse()` is the explicit, bounded operation for static catalogs.

## Composing catalogs and format sources[​](#composing-catalogs-and-format-sources "Direct link to Composing catalogs and format sources")

Catalog discovery and asset decoding are intentionally separate:

1. Open a catalog with `STACSourceLoader`.
2. Select an Item and a suitable data asset.
3. Open that asset with a format source such as `ParquetSourceLoader`, `GeoTIFFSourceLoader`, or `PMTilesSourceLoader`.

This keeps the STAC module small and lets each format source retain its own range planning, predicate pushdown, worker, and caching behavior.

## CORS and random access[​](#cors-and-random-access "Direct link to CORS and random access")

A public object URL is not necessarily browser-readable. Browser-native random access requires:

* a successful cross-origin `GET` or `HEAD` request;
* support for a single byte range with a `206 Partial Content` response;
* readable `Content-Range`, `Content-Length`, and preferably `ETag` or version headers.

When a STAC Item offers multiple mirrors, test the chosen asset host rather than assuming every provider has the same CORS policy. In browser JavaScript, a CORS rejection is intentionally indistinguishable from some network failures, so applications should present it as an inaccessible asset and offer another mirror when available.
