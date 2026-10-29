Archive-backed tiles

# One archive. The tiles the view actually needs.

The PMTiles module connects a single HTTP range-readable archive to tiled data sources, so applications can request tile metadata and payloads without managing a directory of objects.

[PMTiles format](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md)[PMTiles source](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-source-loader.md)

Cloud-native reads

## Ask for the data. Fetch only the bytes behind it.

Range-aware sources translate a logical request into scheduled byte ranges. Metadata, caching, and cancellation stay in the transport layer while the application works with a normal decoded result.

Logical request

[**A tile**visible scene content↗](https://loaders.gl/next/docs/modules/tiles.md)[**A column**selected table data↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**A window**selected raster pixels↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[**A point region**bounded cloud data↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

locat&#x65;**→**

\[ ]

Range scheduler

mergecacheabort

offsets · limits · HTTP Range

rea&#x64;**→**

Useful bytes

**Header bytes**discover the layout

**Selected intervals**fetch only what is needed

**Decoded result**table, tile, or raster data

The same access pattern powers tiled scenes, columnar files, point clouds, and windowed rasters without making the whole object a prerequisite.

The archive boundary

## Keep tile addressing separate from tile decoding.

PMTiles provides the archive index and byte ranges. The selected payload can then be handed to the appropriate vector, raster, or scene loader.

01

Index

Archive metadata and tile directory

02

Request

Tile coordinates and HTTP byte ranges

03

Payload

MVT, raster, or another tiled format

04

Runtime

Source scheduling and cache integration

Support for reading and packaging tiled data in [PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md) archives.

Detailed guide

## PMTiles sources, writing and attribution

The sections below list the source and writer APIs and the underlying PMTiles library attribution.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| API                                                                                                                          | Description                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`PMTilesSourceLoader`](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-source-loader.md)      | Loads tiled data from PMTiles archives.                                                                               |
| [`PMTilesWriter`](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/pmtiles-writer.md) / `encodePMTiles` | Packages existing MVT, MLT and raster tile payloads into bounded PMTiles v3 archives. From v5.0.                      |
| [`encodeGeoArrowPMTiles`](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/geoarrow-pmtiles.md)         | Reuses the GeoArrow tiler and MVT/MLT writers for bounded selected-tile authoring. From v5.0.                         |
| [`encodeRasterPMTiles`](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/raster-pmtiles.md)             | Exports selected byte-imagery regions as PNG tiles, reusing numeric raster sources and the shared sampler. From v5.0. |

## Attribution[​](#attribution "Direct link to Attribution")

Archive reading and Hilbert tile addressing use the [protomaps PMTiles library](https://github.com/protomaps/PMTiles/blob/main/LICENSE) under BSD 3-Clause license.
