# Overview

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for GeoZarr
CRS discovery, current native-CRS behavior, and the raster-warping roadmap.

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

The `@loaders.gl/zarr` module reads chunked, multidimensional [Zarr](https://zarr.dev/)
arrays. It supports the existing pixel-pyramid API, an OME-Zarr source API for bioimaging, and a
GeoZarr/CF source API for georeferenced Earth-science rasters.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/zarr
```

## APIs

- [`OMEZarrSourceLoader`](/docs/modules/zarr/api-reference/ome-zarr-source-loader) opens OME-Zarr
  v2 and v3 image groups through `createDataSource()` or `load()`.
- [`GeoZarrSourceLoader`](/docs/modules/zarr/api-reference/geo-zarr-source-loader) opens one
  georeferenced Zarr data variable and reads native spatial windows with named time, vertical, or
  band selections.
- `loadZarrConsolidatedMetadata()` probes `.zmetadata`, `zmetadata`, and `zarr.json` documents and
  reports top-level arrays and groups.
- `loadZarr()` and `ZarrPixelSource` provide the legacy Zarr v2 pixel-pyramid API.

## Example

```ts
import {createDataSource} from '@loaders.gl/core';
import {OMEZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/spatialdata.zarr', [OMEZarrSourceLoader], {
  zarr: {path: 'images/example-image'}
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({level: 0, channels: [0, 1, 2]});
```

The [OME-Zarr example](/examples/bioimaging/ome-zarr) demonstrates browsing a SpatialData-style
root and selecting an image pyramid.

For climate, weather, ocean, satellite, and other Earth-science stores, use
`GeoZarrSourceLoader`. It recognizes the current GeoZarr `proj:` and `spatial:` conventions as
well as the regular one-dimensional coordinate arrays commonly written by xarray/CF workflows.
The [GeoZarr deck.gl example](/examples/geospatial/geo-zarr) reads a public NASA POWER climatology
store directly from S3 and renders monthly solar irradiance on an interactive map.

## Feature matrix

| Capability | Zarr v2 | Zarr v3 | OME-Zarr | GeoZarr / CF | Status |
| --- | --- | --- | --- | --- | --- |
| Browser and Node.js reads | Yes | Yes | Yes | Yes | Available |
| HTTP range/chunked access | Yes | Yes | Yes | Yes | Available |
| Consolidated metadata discovery | `.zmetadata`, `zmetadata` | `zarr.json` | Yes | Yes | Available |
| Multidimensional arrays and named dimensions | Yes | Yes | Yes | Yes | Available |
| Chunk-aware raster reads | Yes | Yes | Yes | Yes | Available |
| OME image channels, time, and z planes | — | — | Yes | — | Available |
| OME multiscale pyramids | — | — | Yes | — | Available |
| Automatic display-level selection | — | — | Yes | — | Available |
| Scan metadata and source discovery | — | — | Yes | Yes | Available through both raster sources |
| GeoZarr `proj:` and `spatial:` metadata | — | — | — | Yes | Available |
| CF/xarray coordinates, time, vertical, and band selection | — | — | — | Yes | Available |
| Viewport-driven geospatial windows | — | — | — | Yes | Available |
| Typed planar or interleaved channel output | Yes | Yes | Yes | Yes | Available |
| Zarrita-backed v2/v3 implementation | Yes | Yes | Yes | Yes | Available |
| SpatialData tables, points, and shapes | — | — | Planned | — | Planned |
| Codec expansion and broader multiscale layouts | Partial | Partial | Planned | Planned | Planned |
| Common raster query execution | — | — | Levels, channels, and slices | Native spatial windows and named selections | Available |

## Scan support

Zarr participates through two raster sources. Both read only the selected chunks and preserve typed
array output, but their query vocabulary reflects the kind of array being opened.

| Capability | OME-Zarr | GeoZarr / CF |
| --- | --- | --- |
| Entry point | `getRaster()` | `getRaster()` |
| Metadata discovery | Channels, dimensions, multiscale levels | Variable, dtype, dimensions, bounds, CRS |
| Spatial window | Image window | Native-CRS viewport bounds |
| Resolution | Multiscale level pushdown | Native resolution; explicit level unsupported |
| Non-spatial selection | Channels, time, and z slices | Named time, vertical, band, or other dimension indices |
| Physical access | Selected Zarr chunks and codecs | Selected Zarr chunks and codecs |
| Output | Typed planar or interleaved pixels | Typed raster data |
| Reprojection | Not applicable to ordinary OME image coordinates | Not performed |

Query metadata is suitable for populating source-neutral controls before pixel data is requested.
GeoZarr bounds must use the source CRS; callers should reproject the viewport before requesting a
window when necessary.

## Attributions

The OME-Zarr source uses [zarrita.js](https://zarrita.dev/) under the MIT license. The legacy Zarr
v2 API wraps [zarr.js](https://github.com/gzuidhof/zarr.js/) under the MIT license.
