---
title: MapLibre Tile format
description: A binary vector-tile format for named feature tables, geometry, and attributes.
hide_title: true
page_style: designed
---

import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Binary vector-tile format"
  title="Put a tile’s geometry and attributes on one path."
  description="MapLibre Tile (MLT) is a compact binary tile format for feature tables addressed by a tile coordinate. loaders.gl decodes its named tables into reusable GeoJSON, binary geometry, or Arrow data."
  tone="cyan"
  meta={['MapLibre Tile', 'Binary geometry', 'Feature tables']}
  links={[
    {label: 'MLT module', to: '/docs/modules/mlt'},
    {label: 'MLT source', to: '/docs/modules/mlt/api-reference/mlt-source-loader'}
  ]}
/>

<TileDocsTabs active="mlt" />

<DocOrientation
  eyebrow="The tile boundary"
  title="Address the tile, then choose its data shape."
  description="MLT handles the binary payload inside a tile. The source or tile layer owns addressing, while the application chooses a compatible decoded representation for rendering or analysis."
  tone="cyan"
  items={[
    {label: 'Address', value: 'Z/X/Y tile coordinates'},
    {label: 'Decode', value: 'Named feature tables and geometry families'},
    {label: 'Choose', value: 'GeoJSON, binary geometry, or Arrow output'},
    {label: 'Continue', value: 'Render, analyze, or pass data to another stage'}
  ]}
/>

- _[MapLibre Tile format](https://github.com/maplibre/mlt)_
- _[@loaders.gl/mlt](/docs/modules/mlt)_
- _[MLTLoader](/docs/modules/mlt/api-reference/mlt-loader)_
- _[MLTSourceLoader](/docs/modules/mlt/api-reference/mlt-source-loader)_
- _[MLT example](/examples/tiles/mlt)_

A MapLibre Tile (MLT) file is a binary geospatial tile format used by vector tile services and tooling.

The format stores one or more named feature tables. Each table has a mandatory geometry column, an
optional feature ID column, and optional property columns. The tile metadata describes the physical
streams in each column; the streams can be decoded independently and are laid out so that tables can
be concatenated and accessed efficiently.

`MLTLoader` can decode these tables into GeoJSON, binary geometry, or Arrow. Arrow output is built
directly from MLT's decoded column vectors without an intermediate GeoJSON conversion.

For the normative format description, see the [MapLibre Tile specification](https://maplibre.org/maplibre-tile-spec/specification/)
and its [encoding definitions](https://maplibre.org/maplibre-tile-spec/encodings/).

<ReferenceBoundary
  title="MLT structure and compatibility"
  description="The sections below cover the columnar layout, compression variants, geometry topology, and the representations returned by the current JavaScript decoder."
  tone="cyan"
/>

## File format

MLT tiles are typically addressed using a Z/X/Y tile coordinate scheme.

Common properties:

| Property       | Value                           |
| -------------- | ------------------------------- |
| File Extension | `.mlt`                          |
| MIME Type      | `application/vnd.maplibre-tile` |
| Container      | Binary                          |

## Column and compression variants

MLT separates a logical column from the physical streams used to store it. A stream can combine a
logical-level encoding with a physical-level encoding, so a single property or geometry may use more
than one compression step.

| MLT variant | What it does | Loader behavior |
| --- | --- | --- |
| Plain | Stores values directly, including little-endian numeric values and UTF-8 strings. | Decoded by `@maplibre/mlt` and exposed through property vectors or geometry vectors. |
| VarInt and ZigZag | Packs integer values into variable-length bytes and efficiently represents signed deltas. | Transparent to the loader. |
| Delta and RLE / delta-RLE | Stores differences or repeated runs instead of every value. | Transparent to the loader. |
| Boolean-RLE and byte-RLE | Packs boolean presence/data streams and compact byte streams. | Transparent to the loader. |
| SIMD-FastPFOR | Packs integer streams in blocks for compact, fast decoding. | Transparent to the loader when supported by the installed decoder. |
| String dictionary / shared dictionary | Stores unique strings once and references them by integer index. | Returned as ordinary JavaScript string property values. |
| FSST dictionary | Compresses repeated substrings in string dictionaries. | Returned as ordinary JavaScript string property values. |
| Vertex dictionary | Stores unique geometry vertices and references them through offsets. | Reconstructed as coordinate arrays by the decoder. |
| Morton vertex dictionary | Orders vertices using a Morton curve before integer compression. | Reconstructed as coordinate arrays by the decoder. |

The loader does not reimplement these compression schemes. It consumes the decoded vectors from
`@maplibre/mlt`, so the compression choice normally does not change the Arrow-building code. This
also means support follows the version of the installed JavaScript decoder.

## Geometry and topology

The standard geometry column separates geometry type, topology lengths, vertex offsets, vertex data,
and—when a tile is prepared for GPU rendering—triangle counts and index buffers. The decoded geometry
families currently handled by loaders.gl are:

- `Point`, `MultiPoint`
- `LineString`, `MultiLineString`
- `Polygon`, `MultiPolygon`

For ordinary geometry, the JavaScript decoder exposes a `GeometryVector` and its `getGeometries()`
method. The loader reads those coordinate arrays directly and writes them to WKB or GeoArrow.
Coordinates are currently treated as 2D `x,y` values; the current path does not preserve optional
Z/M/ZM coordinates or nested struct properties.

### Pre-tessellated geometry

MLT can store polygon meshes in addition to polygon outlines. In that form the decoder exposes a GPU
geometry vector containing:

- a vertex buffer,
- an index buffer, and
- triangle offsets.

The loader deliberately extracts the geometry outline through `getGeometries()` when producing
GeoJSON, WKB, or GeoArrow. It does not currently return the triangle index/vertex buffers as a mesh
output. This keeps the public loader shapes consistent, while preserving a clear future extension
point for a GPU-oriented output shape.

The outline extraction also means pre-tessellated polygons still work with the existing geometry
families and with coordinate projection, but the triangulation itself is not exposed to the returned
Arrow table.

## Decoder support and output limits

The current `@maplibre/mlt` JavaScript decoder and loaders.gl adapter support the common feature-table
surface:

- nullable booleans, 32-bit and 64-bit signed/unsigned integers, floats, doubles, and strings;
- the six geometry families listed above;
- layer filtering, tile extents, local coordinates, and optional WGS84 projection; and
- GeoJSON, binary geometry, WKB GeoArrow, and native GeoArrow output.

The following specification features are not yet represented by the loaders.gl Arrow output:

- 8-bit integer property columns;
- nested/struct property columns and vertex-scoped properties;
- optional Z/M/ZM geometry coordinates; and
- feature IDs as a dedicated Arrow column.

These are distinct from compression support: a tile may use a supported compression scheme and still
contain a logical type that the current JavaScript decoder or Arrow adapter cannot represent.

## Arrow output choices

Arrow output uses `mlt.shape: 'arrow-table'`. The default geometry column is WKB-compatible GeoArrow.
Applications can request native GeoArrow with `geoarrow.encodingPreference`:

| Preference | Result |
| --- | --- |
| `geoarrow.wkb` | One WKB geometry column; default. |
| `geoarrow.geometry` | A dense union for mixed geometry families. |
| `optimized` | A concrete native encoding when all rows share a family, or a dense union when they do not. |

Native output is currently XY-only and carries GeoArrow extension metadata. See the
[MLT loader options](/docs/modules/mlt/api-reference/mlt-loader) for the complete option shape.
