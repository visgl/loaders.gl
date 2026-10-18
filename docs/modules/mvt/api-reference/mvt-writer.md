---
title: MVTWriter
description: Encode geometry as Mapbox Vector Tile protobuf data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MVT module · writer API"
  title="MVTWriter"
  description="Encode GeoJSON-style geometry as a compact Mapbox Vector Tile, with control over layer naming, tile extent, version, and coordinate projection."
  tone="blue"
  meta={['Experimental', 'MVT 1 / 2', 'Protobuf output']}
  links={[
    {label: 'MVT format', to: '/docs/modules/mvt/formats/mvt'},
    {label: 'MVTLoader', to: '/docs/modules/mvt/api-reference/mvt-loader'},
    {label: 'MVT module', to: '/docs/modules/mvt'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Package geometry for tile delivery."
  description="MVTWriter turns feature geometry and properties into the protobuf tile payload expected by vector-tile clients and tile sources."
  tone="blue"
  items={[
    {label: 'Input', value: 'GeoJSON-style geometry data'},
    {label: 'Output', value: 'Binary Mapbox Vector Tile'},
    {label: 'Layer', value: 'A named layer in the tile'},
    {label: 'Projection', value: 'Optional WGS84 to tile-space conversion'}
  ]}
/>

<ReferenceBoundary
  title="MVTWriter reference"
  description="The sections below document format metadata, installation, usage, and encoding options."
  tone="blue"
/>

Writer for the [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) format for representation of geometry.

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.mvt`,                                                                   |
| File Type      | Binary                                                                    |
| File Format    | [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) |
| Data Format    | [Geometry](/docs/specifications/category-gis)                             |
| Supported APIs | `encode`, `encodeSync`                                                    |

## Installation

```bash
npm install @loaders.gl/tiles
npm install @loaders.gl/core
```

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {MVTWriter} from '@loaders.gl/tiles/mvt';

const arrayBuffer = await encode(geojson, MVTWriter, {
  mvt: {
    layerName: 'my-layer',
    version: 2,
    extent: 4096
  }
});
```

## Options

| Option        | Type                                | Default          | Description                                                          |
| ------------- | ----------------------------------- | ---------------- | -------------------------------------------------------------------- |
| mvt.layerName | `string`                            | `'geojsonLayer'` | Name of the single layer that will be written into the tile          |
| mvt.version   | `number`                            | `1`              | Vector tile specification version                                    |
| mvt.extent    | `number`                            | `4096`           | Extent of the vector tile grid                                       |
| mvt.tileIndex | `{x: number, y: number, z: number}` | `undefined`      | Optional tile index for projecting WGS84 coordinates into tile space |

## GeoArrow WKB tiles (from v5.0)

`MVTWriter` also accepts a loaders.gl ArrowTable or Apache Arrow Table with a GeoArrow WKB
geometry column. Attributes are read directly from Arrow vectors at the protobuf boundary, including
sliced and multi-batch tables and dictionaries. It does not construct GeoJSON property rows.

Use the [Arrow tiler](./arrow-table-tile-source-loader) for geographic, native GeoArrow or WKT input.
Its normalized local WKB tiles can be encoded directly:

```typescript
const tile = await arrowTileSource.getTile({z: 1, x: 0, y: 0});
const bytes = tile && MVTWriter.encodeSync(tile, {mvt: {layerName: 'places', idColumn: 'id'}});
```

| Arrow option | Default | Meaning |
| --- | --- | --- |
| `mvt.geometryColumn` | GeoParquet primary column or sole GeoArrow WKB field | Geometry selection |
| `mvt.coordinates` | `'local'` | Explicit normalized local XY, extent-unit `'tile'`, or longitude/latitude `'wgs84'` requiring a valid tileIndex |
| `mvt.propertyColumns` | Non-geometry columns | Select supported scalar attributes |
| `mvt.idColumn` | None | Nonnegative JavaScript-safe integer feature IDs |
| `mvt.maxFeatures` | `100000` | Maximum Arrow rows before encoding |
| `mvt.version` | `2` for Arrow | MVT version 1 or 2; legacy GeoJSON defaults remain unchanged |
| `mvt.extent` | `4096` | Integer extent from 1 through 65536 for Arrow |

Arrow coordinate mode is explicit, with no coordinate-magnitude heuristic. Local coordinates may
extend outside 0–1 to retain the clipping buffer. Declared geographic CRS requires explicit geographic coordinate mode; projected CRS must be
reprojected first. Geographic projection clamps polar latitude to the Web Mercator limit. Geometry must be finite XY; polygons are closed and oriented according to MVT
v2, and quantization-collapsed paths are omitted. A tile with no remaining features returns an empty
ArrayBuffer, which export orchestration skips.

Supported attributes are nullable booleans, UTF-8 strings, finite numbers, and dictionaries of these
scalars. Null properties are omitted. Arrow integer values outside the JavaScript safe integer range
fail explicitly; supported negative integer extrema use exact double storage when signed zigzag
cannot preserve them. Unsupported nested, date, binary and other column types fail rather than being
stringified. This writer profile is in-memory and its row limit is not a vertex or peak-memory cap.

See [GeoArrow to PMTiles](/docs/modules/pmtiles/api-reference/geoarrow-pmtiles) for a complete bounded
export and browser download example.
