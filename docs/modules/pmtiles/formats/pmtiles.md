# PMTiles 

PMTiles is a single-file archive format for tiled data designed to enable individual tiles to be loaded via HTTP range request access. A PMTiles archive can be hosted on a commodity storage platform such as Amazon S3.

- *[PMTiles](https://github.com/protomaps/PMTiles)*

## Overview

PMTiles is a general format for storing tiled data addressed by Z/X/Y coordinates in a single big archive file. This can be used to store cartographic basemap vector tiles, remote sensing observations, JPEG images, or more. 

PMTiles readers use HTTP Range Requests to fetch only the relevant tile or metadata inside a PMTiles archive on-demand.

## Tile types

PMTiles is a container format and can in principle contain any type of quadtree tiles. A number of vector and image tile types are predefined.

| Type | MIME type                              | pmtiles | Description                                         |
| ---- | -------------------------------------- | ------- | --------------------------------------------------- |
| MVT  | `'application/vnd.mapbox-vector-tile'` | `1`     | [Mapbox Vector Tile](/docs/modules/mvt/formats/mvt) |
| PNG  | `'image/png'`                          | `2`     |                                                     |
| JPEG | `'image/jpeg'`                         | `3`     |                                                     |
| WEBP | `'image/webp'`                         | `4`     |                                                     |
| AVIF | `'image/avif'`                         | `5`     |                                                     |
| -    | `'application/octet-stream'`           | -       | Undefined / Custom types                            |


## Metadata

The pmtiles header has a field that can store JSON metadata. This means that for MVT pmtiles, [TileJSON](/docs/modules/mvts/formats/tilejson) is typically available, stored in the PMTiles header metadata field.


## Version History

**Version 3**

- File Structure - smaller overhead 
- Unlimited metadata - version 2 had a hard cap on the amount of JSON metadata of about 300 kilobytes Allows tools like tippecanoe to store detailed column statistics. Essential archive information, such as tile type and compression methods, are stored in a binary header separate from application metadata.
- Hilbert tile IDs - tiles internally are addressed by a single 64-bit Hilbert tile ID instead of Z/X/Y. See the blog post on Tile IDs for details.
- Archive ordering - An optional clustered mode enforces that tile contents are laid out in Tile ID order.
- Compressed directories and metadata - Directories used to fetch offsets of tile data consume about 10% the space of those in version 2.
- JavaScript Compression - The TypeScript pmtiles library now includes a decompressor - fflate - to allow reading compressed vector tile archives directly in the browser. This reduces the size and latency of vector tiles by as much as 70%.
- Tile Cancellation - All JavaScript plugins now support tile cancellation, meaning quick zooming across many levels will interrupt the loading of tiles that are never shown. This has a significant effect on the perceived user experience, as tiles at the end of a animation will appear earlier.
- ETag support - clients can detect when files change on static storage by reading the ETag HTTP header. This means that PMTiles-based map applications can update datasets in place at low frequency without running into caching problems.
