Cloud tile archive

# Keep a tileset in one range-readable file.

PMTiles replaces a directory of tile objects with one archive whose header and directories locate the tile ranges needed for a view. The payload can remain vector, raster, or terrain data.

[PMTiles module](https://loaders.gl/next/docs/modules/tiles/pmtiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/pmtiles.md)[PMTiles source](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-source-loader.md)

[Try MVT](https://loaders.gl/next/examples/tiles/mvt)[Try PMTiles](https://loaders.gl/next/examples/tiles/pmtiles)[Create PMTiles](https://loaders.gl/next/examples/tiles/pmtiles-authoring)[Try Arrow Tiler](https://loaders.gl/next/examples/tiles/table-tiler)[Try MLT](https://loaders.gl/next/examples/tiles/mlt)[MVT](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md)[Arrow Table Tiler](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/arrow-table-tile-source-loader.md)[TableTileSourceLoader](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/table-tile-source-loader.md)[MLT](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

The archive workflow

## Read the index, resolve the tile, fetch the payload.

PMTiles owns archive addressing and range reads. Once the tile bytes arrive, the application can pass them to the loader for the payload’s actual format.

01

Header

Archive bounds, zooms, tile type, and metadata

02

Directory

Compact tile identifiers and byte ranges

03

Request

Z/X/Y lookup over HTTP range requests

04

Decode

MVT, image, terrain, or another tile payload

[![Optional scan table view](https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square)](https://loaders.gl/next/docs/modules/core/scan#vector-table-views)

* [*`@loaders.gl/tiles/pmtiles`*](https://loaders.gl/next/docs/modules/tiles/pmtiles.md)
* [*PMTiles specification*](https://github.com/protomaps/PMTiles)
* [*PMTiles example*](https://loaders.gl/next/examples/tiles/pmtiles).

PMTiles is a general format for storing tiled data addressed by Z/X/Y coordinates in a single (big) archive file. PMTiles is optimized for the cloud and can be hosted on commodity storage platforms like S3, enabling low-cost, zero-maintenance map applications, without requiring a server in the middle. PMTiles is structured to minimize overhead requests. The current V3 version of the format includes directories and tile data.

PMTiles is commonly used for visualization (e.g. for cartographic basemap vector tiles), and then often contains vector data, where each tile data contained within the archive is encoded as a Mapbox Vector Tile (MVT) or MapLibre Tile (MLT), however it can also be used to store image tiles (in PNG and JPEG format) containing e.g. raster data or terrain mesh data.

A PMTiles archive replaces a big directory tree of thousands of individual tile files, allowing an entire tileset to be manipulated (uploaded, downloaded, served, analyzed) as a single file.

Detailed guide

## PMTiles layout and tile types

The sections below describe the optional table view, supported payload types, metadata, and archive refresh behavior.

In addition, there is a range of utilities and libraries for working with PMTiles, such Python packages for reading and writing, and support for various programming languages and tools as well as a number of viewers. And tiling tools such as [tippecanoe](https://github.com/felt/tippecanoe) can now output directly to PMTiles.

## Optional scan table view[​](#optional-scan-table-view "Direct link to Optional scan table view")

For a vector PMTiles archive, the PMTiles source first resolves z/x/y and returns one MVT tile as an Arrow table. `VectorTileTableScanSource` can then apply a portable query to those feature rows.

| Capability                                                          | Support                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Archive directory and tile range lookup                             | ✅ PMTiles source                                                   |
| Tile address and layer selection                                    | ✅ Specialized source parameters                                    |
| Predicate, projection, expressions, ordering, aggregates, and limit | ✅ Residual Arrow execution after tile decoding                     |
| Cancellation                                                        | ✅ Supported while resolving the tile and executing the table query |
| Cross-tile query                                                    | ❌ Not provided                                                     |
| Raster or terrain tile table view                                   | Not applicable                                                      |

The adapter does not scan the archive as one logical table and does not imply server-side or directory-level predicate pruning.

## Tile types[​](#tile-types "Direct link to Tile types")

PMTiles is a container format and can in principle contain any type of quadtree-organized tiles. A number of vector and image tile types are predefined.

| Type   | MIME type                              | pmtiles | Description                                                                              |
| ------ | -------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `MVT`  | `'application/vnd.mapbox-vector-tile'` | `1`     | [Mapbox Vector Tile](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md) |
| `PNG`  | `'image/png'`                          | `2`     |                                                                                          |
| `JPEG` | `'image/jpeg'`                         | `3`     |                                                                                          |
| `WEBP` | `'image/webp'`                         | `4`     |                                                                                          |
| `AVIF` | `'image/avif'`                         | `5`     |                                                                                          |
| `MLT`  | `'application/vnd.maplibre-tile'`      | `6`     | [MapLibre Tile](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)      |
| ...    | `'application/octet-stream'`           | ...     | Can be used for custom tile types                                                        |

## Packaging support (from v5.0)[​](#packaging-support-from-v50 "Direct link to Packaging support (from v5.0)")

The [PMTiles writer](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-writer.md) packages existing payloads; it does not generate vector or raster tile pyramids.

| Feature                                      | Write            | Notes                                                                                                                                                                                     |
| -------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PMTiles v3 header, root and leaf directories | ✅               | Hilbert-sorted XYZ addresses; root fits in the first 16 KiB                                                                                                                               |
| MVT and MLT payloads                         | ✅               | Opaque byte preservation; one declared format per archive                                                                                                                                 |
| PNG, JPEG, WebP and AVIF payloads            | ✅               | Existing image tile pyramids; no image encoding                                                                                                                                           |
| Internal compression                         | ✅               | None or gzip                                                                                                                                                                              |
| Tile compression                             | Declaration only | None, gzip, Brotli or Zstd; payloads must already match                                                                                                                                   |
| Bounds, zooms and JSON metadata              | ✅               | Derived tile footprints or explicit bounds; MVT layer declarations required                                                                                                               |
| Cancellation and output budgets              | ✅               | Bounded in-memory output; no peak-memory guarantee                                                                                                                                        |
| Tile deduplication and streaming output      | ✕                | Follow-up work                                                                                                                                                                            |
| GeoArrow to MVT authoring                    | ✅               | [Bounded in-memory export](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/geoarrow-pmtiles.md) reuses the existing tiler; selected addresses and scalar attributes |
| GeoArrow to MLT authoring                    | ✅               | Same selected-tile pipeline; MLT v1 with nullable scalar attributes and safe numeric IDs                                                                                                  |
| Raster region to PNG authoring               | ✅               | [Selected-region export](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/raster-pmtiles.md), raw uint8 imagery in Web Mercator or longitude/latitude. From v5.0.    |

## Metadata[​](#metadata "Direct link to Metadata")

The pmtiles header has a metadata field that can store arbitrary JSON metadata about the tileset. This means that for MVT pmtiles, [TileJSON](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md) is typically available in the PMTiles header.

## Advanced Features[​](#advanced-features "Direct link to Advanced Features")

pmtiles supports refreshing the index if the underlying PMTiles file is rewritten and the storage backend supports ETag headers (which Amazon S3 does).
