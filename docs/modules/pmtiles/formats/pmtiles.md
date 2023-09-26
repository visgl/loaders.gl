# PMTiles 

PMTiles is a single-file archive format for tiled data designed to enable individual tiles to be loaded via HTTP range request access. A PMTiles archive can be hosted on a commodity storage platform such as Amazon S3.

- *[PMTiles][https://github.com/protomaps/PMTiles]*

## Overview

TBA

## Versions

## Version 3

- File Structure
97% smaller overhead - Spec version 2 would always issue a 512 kilobyte initial request; version 3 reduces this to 16 kilobytes. What remains the same is that nearly any map tile can be retrieved in at most two additional requests.
- Unlimited metadata - version 2 had a hard cap on the amount of JSON metadata of about 300 kilobytes; version 3 removes this limit. This is essential for tools like tippecanoe to store detailed column statistics. Essential archive information, such as tile type and compression methods, are stored in a binary header separate from application metadata.
- Hilbert tile IDs - tiles internally are addressed by a single 64-bit Hilbert tile ID instead of Z/X/Y. See the blog post on Tile IDs for details.
- Archive ordering - An optional clustered mode enforces that tile contents are laid out in Tile ID order.
- Compressed directories and metadata - Directories used to fetch offsets of tile data consume about 10% the space of those in version 2. See the blog post on compressed directories for details.
- JavaScript
Compression - The TypeScript pmtiles library now includes a decompressor - fflate - to allow reading compressed vector tile archives directly in the browser. This reduces the size and latency of vector tiles by as much as 70%.
- Tile Cancellation - All JavaScript plugins now support tile cancellation, meaning quick zooming across many levels will interrupt the loading of tiles that are never shown. This has a significant effect on the perceived user experience, as tiles at the end of a animation will appear earlier.
- ETag support - clients can detect when files change on static storage by reading the ETag HTTP header. This means that PMTiles-based map applications can update datasets in place at low frequency without running into caching problems.

## Version 3 Specification

### File structure

A PMTiles archive is a single-file archive of square tiles with five main sections:

1. A fixed-size, 127-byte **Header** starting with `PMTiles` and then the spec version - currently `3` - that contains offsets to the next sections.
2. A root **Directory**, described below. The Header and Root combined must be less than 16,384 bytes.
3. JSON metadata.
4. Optionally, a section of **Leaf Directories**, encoded the same way as the root.
5. The tile data.

### Entries

A Directory is a list of `Entries`, in ascending order by `TileId`:

    Entry = (TileId uint64, Offset uint64, Length uint32, RunLength uint32)

* `TileId` starts at 0 and corresponds to a cumulative position on the series of square Hilbert curves starting at z=0.
* `Offset` is the position of the tile in the file relative to the start of the data section.
*	`Length` is the size of the tile in bytes. 
* `RunLength` is how many times this tile is repeated: the `TileId=5,RunLength=2` means that tile is present at IDs 5 and 6.
* If `RunLength=0`, the offset/length points to a Leaf Directory where `TileId` is the first entry.

### Directory Serialization

Entries are stored in memory as integers, but serialized to disk using these compression steps:

1. A little-endian varint indicating the # of entries
2. Delta encoding of `TileId`
3. Zeroing of `Offset`:
	* `0` if it is equal to the `Offset` + `Length` of the previous entry
	* `Offset+1` otherwise
4. Varint encoding of all numbers
5. Columnar ordering: all `TileId`s, all `RunLength`s, all `Length`s, then all `Offset`s
6. Finally, general purpose compression as described by the `Header`'s `InternalCompression` field

##3 Directory Hierarchy

* The number of entries in the root directory and leaf directories is up to the implementation.
* However, the compressed size of the header plus root directory is required in v3 to be under **16,384 bytes**. This is to allow latency-optimized clients to prefetch the root directory and guarantee it is complete. A sophisticated writer might need several attempts to optimize this. 
* Root size, leaf sizes and depth should be configurable by the user to optimize for different trade-offs: cost, bandwidth, latency.

### Header Design

*Certain fields belonging to metadata in v2 are promoted to fixed-size header fields. This allows a map container to be initialized to the desired extent or center without blocking on the JSON metadata, and allows proxies to return well-defined HTTP headers.*

The `Header` is 127 bytes, with little-endian integer values:

| offset | description                                                                               | width |
| ------ | ----------------------------------------------------------------------------------------- | ----- |
| 0      | magic number `PMTiles`                                                                    | 7     |
| 7      | spec version, currently `3`                                                               | 1     |
| 8      | offset of root directory                                                                  | 8     |
| 16     | length of root directory                                                                  | 8     |
| 24     | offset of JSON metadata, possibly compressed by `InternalCompression`                     | 8     |
| 32     | length of JSON metadata                                                                   | 8     |
| 40     | offset of leaf directories                                                                | 8     |
| 48     | length of leaf directories                                                                | 8     |
| 56     | offset of tile data                                                                       | 8     |
| 64     | length of tile data                                                                       | 8     |
| 72     | # of addressed tiles, 0 if unknown                                                        | 8     |
| 80     | # of tile entries, 0 if unknown                                                           | 8     |
| 88     | # of tile contents, 0 if unknown                                                          | 8     |
| 96     | boolean clustered flag, `0x1` if true                                                     | 1     |
| 97     | `InternalCompression` enum (0 = Unknown, 1 = None, 2 = Gzip, 3 = Brotli, 4 = Zstd)        | 1     |
| 98     | `TileCompression` enum                                                                    | 1     |
| 99     | tile type enum (0 = Unknown/Other, 1 = MVT (PBF Vector Tile), 2 = PNG, 3 = JPEG, 4 = WEBP | 1     |
| 100    | min zoom                                                                                  | 1     |
| 101    | max zoom                                                                                  | 1     |
| 102    | min longitude (signed 32-bit integer: longitude * 10,000,000)                             | 4     |
| 106    | min latitude                                                                              | 4     |
| 110    | max longitude                                                                             | 4     |
| 114    | max latitude                                                                              | 4     |
| 118    | center zoom                                                                               | 1     |
| 119    | center longitude                                                                          | 4     |
| 123    | center latitude                                                                           | 4     |

### Notes

* **# of addressed tiles**: the total number of tiles before run-length encoding, i.e. `Sum(RunLength)` over all entries.
* **# of tile entries**: the total number of entries across all directories where `RunLength > 0`.
* **# # of tile contents**: the number of referenced blobs in the tile section, or the unique # of offsets. If the archive is completely deduplicated, this is equal to the # of unique tile contents. If there is no deduplication, this is equal to the number of tile entries above.
* **boolean clustered flag**: if true, blobs in the data section are ordered by Hilbert `TileId`. When writing with deduplication, this means that offsets are either contiguous with the previous offset+length, or refer to a lesser offset.
* **compression enum**: Mandatory, tells the client how to decompress contents as well as provide correct `Content-Encoding` headers to browsers.
* **tile type**: A hint as to the tile contents. Clients and proxies may use this to:
 	* Automatically determine a visualization method
	* provide a conventional MIME type `Content-Type` HTTP header
	* Enforce a canonical extension e.g. `.mvt`, `png`, `jpeg`, `.webp` to prevent duplication in caches

### Organization

In most cases, the archive should be in the order `Header`, Root Directory, JSON Metadata, Leaf Directories, Tile Data. It is possible to relocate sections other than `Header` arbitrarily, but no current writers/readers take advantage of this. A future design may allow for reverse-ordered archives to enable single-pass writing.


## Version 2

*Note: this is deprecated in favor of spec version 3.*

PMTiles is a binary serialization format designed for two main access patterns: over the network, via HTTP 1.1 Byte Serving (`Range:` requests), or via memory-mapped files on disk. **All integer values are little-endian.**

A PMTiles archive is composed of:
* a fixed-size 512,000 byte header section
* Followed by any number of tiles in arbitrary format
* Optionally followed by any number of *leaf directories*

### Header
* The header begins with a 2-byte magic number, "PM"
* Followed by 2 bytes, the PMTiles specification version (currently 2).
* Followed by 4 bytes, the length of metadata (M bytes)
* Followed by 2 bytes, the number of entries in the *root directory* (N entries)
* Followed by M bytes of metadata, which **must be a JSON string with bounds, minzoom and maxzoom properties (new in v2)**
* Followed by N * 17 bytes, the root directory.

### Directory structure

A directory is a contiguous sequence of 17 byte entries. A directory can have at most 21,845 entries. **A directory must be sorted by Z, X and then Y order (new in v2).**

An entry consists of:
* 1 byte: the zoom level (Z) of the entry, with the top bit set to 1 instead of 0 to indicate the offset/length points to a leaf directory and not a tile.
* 3 bytes: the X (column) of the entry.
* 3 bytes: the Y (row) of the entry.
* 6 bytes: the offset of where the tile begins in the archive.
* 4 bytes: the length of the tile, in bytes.

**All leaf directory entries follow non-leaf entries. All leaf directories in a single directory must have the same Z value. (new in v2).**

### Notes
* A full directory of 21,845 entries holds exactly a complete pyramid with 8 levels, or 1+4+16+64+256+1024+4096+16384.
* A PMTiles archive with less than 21,845 tiles should have a root directory and no leaf directories.
* Multiple tile entries can point to the same offset; this is useful for de-duplicating certain tiles, such as an empty "ocean" tile.
* Analogously, multiple leaf directory entries can point to the same offset; this can avoid inefficiently-packed small leaf directories.
* The tentative media type for PMTiles archives is `application/vnd.pmtiles`.

### Implementation suggestions

* PMTiles is designed to make implementing a writer simple. Reserve 512KB, then write all tiles, recording their entry information; then write all leaf directories; finally, rewind to 0 and write the header.
* The order of tile data in the archive is unspecified; an optimized implementation should arrange tiles on a 2D space-filling curve.
* PMTiles readers should cache directory entries by byte offset, not by Z/X/Y. This means that deduplicated leaf directories result in cache hits.