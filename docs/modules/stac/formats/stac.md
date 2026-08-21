# STAC

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
