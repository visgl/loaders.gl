---
title: Packages
sidebar_label: Packages
---

# Packages

loaders.gl is a collection of independently installable packages. Install core for loading and parsing, then add the packages that own your formats. Each domain package has explicit format subpaths so applications can select implementations without importing every parser.

## Choose a format package

| Package | Formats and APIs | Example subpaths |
| --- | --- | --- |
| [tables](./modules/tables/README.md) | Arrow, CSV, JSON/GeoJSON, Avro, BSON, Excel, Lance, ORC, Parquet and table datasets | `/csv`, `/arrow`, `/parquet`, `/iceberg`, `/delta` |
| [geospatial](./modules/geospatial/README.md) | KML/GPX/TCX, Shapefile, FlatGeobuf, GeoPackage and geometry text/binary formats | `/kml`, `/shapefile`, `/flatgeobuf`, `/geopackage`, `/wkt`, `/wkb`, `/twkb` |
| [pointclouds](./modules/pointclouds/README.md) | LAS/LAZ, PCD and PLY; PLY retains mesh faces as well as point-cloud output | `/las`, `/pcd`, `/ply` |
| [scene](./modules/scene/README.md) | glTF/GLB, OBJ/MTL and OpenUSD | `/gltf`, `/obj`, `/usd` |
| [raster](./modules/raster/README.md) | GeoTIFF/COG/OME-TIFF, LERC, terrain and quantized mesh | `/geotiff`, `/lerc`, `/terrain` |
| [scientific](./modules/scientific/README.md) | HDF5, NetCDF, Zarr, GRIB and VTK | `/hdf5`, `/netcdf`, `/zarr`, `/grib2`, `/vtk` |
| [tiles](./modules/tiles/README.md) | 2D tile traversal, MVT, MLT and PMTiles | `/mvt`, `/mlt`, `/pmtiles` |
| [tiles-3d](./modules/tiles-3d/README.md) | 3D traversal, 3D Tiles, I3S, COPC and Potree | `/3d-tiles`, `/i3s`, `/copc`, `/potree` |
| [archives](./modules/archives/README.md) | ZIP and TAR archive access | `/zip`, `/tar` |
| [config](./modules/config/README.md) | YAML and TOML | `/yaml`, `/toml` |
| [graphs](./modules/graphs/README.md) | DOT, GraphML and GEXF | See package reference |
| [traces](./modules/traces/README.md) | Chrome Trace, Perfetto, OpenTelemetry, Jaeger and Zipkin | See package reference |
| [splats](./modules/splats/README.md) | Gaussian splat formats | See package reference |

Point-cloud tile traversal belongs in tiles-3d: decoding LAS points does not require installing a tileset runtime. Likewise, 2D and 3D tiles remain separate packages.

## Services and data access

| Package | Purpose |
| --- | --- |
| [ogc](./modules/ogc/README.md) | OGC protocols and STAC catalog access. |
| [arcgis](./modules/arcgis/README.md) | ArcGIS REST data sources. |
| [services](./modules/services/README.md) | Provider authentication presets, including Mapbox, Google Maps and Cesium ion. |
| [sql](./modules/sql/README.md) | SQL data sources and optional database backends. Portable scan/query utilities live in core. |

## Shared infrastructure

| Package or subpath | Purpose |
| --- | --- |
| [core](./modules/core/README.md) | Load, parse, encode, loader selection and shared runtime APIs. |
| `@loaders.gl/core/loader-utils` | Loader contracts, streams, file systems and source utilities. |
| `@loaders.gl/core/worker-utils` | Worker creation, messaging and transfer infrastructure. |
| `@loaders.gl/core/schema`, `/schema-utils` | Shared data types, schemas, table and Arrow utilities. |
| `@loaders.gl/core/scan` | Portable queries, scan execution and federation. |
| `@loaders.gl/core/arrow-geometry` | Focused geometry construction helpers for loaders. |
| `@loaders.gl/core/geoarrow` | Application-facing GeoArrow conversion, validation and processing. |
| `@loaders.gl/core/wkt` | Geometry codec utilities; actual format loaders belong to geospatial. |
| `@loaders.gl/core/polyfills` | Independent Node platform adapters. |
| [compression](./modules/compression/README.md), [crypto](./modules/crypto/README.md) | Compression codecs, hashing and checksums. |
| [xml](./modules/xml/README.md) | XML/HTML parsing and shared XML utilities. |

Core utility subpaths are opt-in imports and are not re-exported from core's root. Core does not depend on domain packages. Published format packages declare core as a peer dependency.

## Graphics and media

[images](./modules/images/README.md), [textures](./modules/textures/README.md), [video](./modules/video/README.md), and [draco](./modules/draco/README.md) remain independent packages. They provide shared image APIs, GPU texture formats, video, and Draco geometry compression without requiring a scene or tileset package.

## Install packages, import subpaths

```bash
npm install @loaders.gl/core @loaders.gl/pointclouds @loaders.gl/scene
```

```typescript
import {parse, parseSync} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {PLYLoaderWithParser} from '@loaders.gl/pointclouds/ply/ply-loader';

const points = await parse(plyBytes, PLYLoader);
const scene = await parse(gltfBytes, GLTFLoader);
const mesh = parseSync(plyBytes, PLYLoaderWithParser, {ply: {shape: 'mesh'}});
```

Group roots and bare format subpaths expose metadata loaders. Async core APIs preload the selected parser. Synchronous APIs require an explicit parser-bearing loader. Writers and format-specific source APIs have explicit entrypoints too.

Subpaths are not separately installable packages. They control parser loading and tree shaking; ordinary dependencies are installed for the whole package. Optional codecs and database engines may require an additional installation, as documented by the owning format. Worker and WASM assets must come from the same package version as the application.

The private deck-layers workspace is used by examples and is not a public package. The tile-converter application has its own documentation and distribution.
