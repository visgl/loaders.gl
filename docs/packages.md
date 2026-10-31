---
title: Packages
sidebar_label: Packages
toc_max_heading_level: 2
---

import {PackageGrid, PackageTile} from '@site/src/components/docs/package-grid';

# Packages

loaders.gl has 22 public packages. Install core and the packages that own your formats, then import the documented format or utility subpaths. Each tile links to its package introduction and focused format references.

## API

<PackageGrid>

<PackageTile>

### [@loaders.gl/core](./modules/core/README.md)

The public loaders.gl API for loading, parsing, streaming, and encoding data across format modules. Common utilities are available through dedicated subpaths such as `core/schema`, `core/loader-utils`, and `core/worker-utils`.

[loader-utils](./modules/core/loader-utils/README.md) · [worker-utils](./modules/core/worker-utils/README.md) · [schema](./modules/core/schema/README.md) · [schema-utils](./modules/core/schema-utils/README.md) · [scan](./modules/core/scan/README.md) · [arrow-geometry](./modules/core/arrow-geometry/README.md) · [geoarrow](./modules/core/geoarrow/README.md) · [wkt](./modules/core/wkt/README.md) · [polyfills](./modules/core/polyfills/README.md)

</PackageTile>

</PackageGrid>

## Formats

<PackageGrid>

<PackageTile formats={[{"slug": "arrow", "to": "/docs/modules/tables/arrow"}, {"slug": "csv", "to": "/docs/modules/tables/csv"}, {"slug": "json", "to": "/docs/modules/tables/json"}, {"slug": "geojson", "to": "/docs/modules/tables/json"}, {"slug": "avro", "to": "/docs/modules/tables/avro"}, {"slug": "excel", "to": "/docs/modules/tables/excel"}, {"slug": "lance", "to": "/docs/modules/tables/lance"}, {"slug": "orc", "to": "/docs/modules/tables/orc"}, {"slug": "parquet", "to": "/docs/modules/tables/parquet"}]}>

### [@loaders.gl/tables](./modules/tables/README.md)

Read tabular data from text files, spreadsheets, and columnar storage into rows or Arrow tables for analysis and visualization.


</PackageTile>

<PackageTile formats={[{"slug": "kml", "to": "/docs/modules/geospatial/kml"}, {"slug": "gpx", "to": "/docs/modules/geospatial"}, {"slug": "tcx", "to": "/docs/modules/geospatial"}, {"slug": "shapefile", "to": "/docs/modules/geospatial/shapefile"}, {"slug": "flatgeobuf", "to": "/docs/modules/geospatial/flatgeobuf"}, {"slug": "geopackage", "to": "/docs/modules/geospatial/geopackage"}, {"slug": "wkt", "to": "/docs/modules/geospatial/wkt"}, {"slug": "wkb", "to": "/docs/modules/geospatial/wkt"}, {"slug": "twkb", "to": "/docs/modules/geospatial/wkt"}]}>

### [@loaders.gl/geospatial](./modules/geospatial/README.md)

Load geographic features, tracks, and vector datasets, and decode or encode geometry representations for mapping applications.


</PackageTile>

<PackageTile formats={[{"slug": "las", "to": "/docs/modules/pointclouds/las"}, {"slug": "pcd", "to": "/docs/modules/pointclouds/pcd"}, {"slug": "ply", "to": "/docs/modules/pointclouds/ply"}]}>

### [@loaders.gl/pointclouds](./modules/pointclouds/README.md)

Load point positions and attributes from survey and 3D scan files. Polygon mesh faces are also preserved when the source format supports them.


</PackageTile>

<PackageTile formats={[{"slug": "draco", "to": "/docs/modules/scene/draco"}, {"slug": "gltf", "to": "/docs/modules/scene/gltf"}, {"slug": "usd", "to": "/docs/modules/scene/usd"}, {"slug": "obj", "to": "/docs/modules/scene/obj"}]}>

### [@loaders.gl/scene](./modules/scene/README.md)

Load 3D assets as meshes and scene graphs, including the materials, textures, and hierarchy described by each format.


</PackageTile>

<PackageTile formats={[{"slug": "geotiff", "to": "/docs/modules/raster/geotiff"}, {"slug": "lerc", "to": "/docs/modules/raster/lerc"}, {"slug": "terrain", "to": "/docs/modules/raster/terrain"}]}>

### [@loaders.gl/raster](./modules/raster/README.md)

Read georeferenced imagery, numeric raster grids, and microscopy images, and turn elevation data into terrain meshes.


</PackageTile>

<PackageTile formats={[{"slug": "hdf5", "to": "/docs/modules/scientific/hdf5"}, {"slug": "netcdf", "to": "/docs/modules/scientific/netcdf"}, {"slug": "zarr", "to": "/docs/modules/scientific/zarr"}, {"slug": "grib2", "to": "/docs/modules/scientific/grib2"}, {"slug": "vtk", "to": "/docs/modules/scientific/vtk"}]}>

### [@loaders.gl/scientific](./modules/scientific/README.md)

Access multidimensional arrays, scientific metadata, weather fields, and simulation datasets. Available source and parsing capabilities vary by format.


</PackageTile>

<PackageTile formats={[{"slug": "mvt", "to": "/docs/modules/tiles/mvt"}, {"slug": "mlt", "to": "/docs/modules/tiles/mlt"}, {"slug": "pmtiles", "to": "/docs/modules/tiles/pmtiles"}]}>

### [@loaders.gl/tiles](./modules/tiles/README.md)

Load and manage tiled 2D maps, with vector tile decoding, tile selection and caching, and access to tile archives.


</PackageTile>

<PackageTile formats={[{"slug": "3d-tiles", "to": "/docs/modules/tiles-3d/3d-tiles"}, {"slug": "i3s", "to": "/docs/modules/tiles-3d/i3s"}, {"slug": "copc", "to": "/docs/modules/tiles-3d/copc"}, {"slug": "potree", "to": "/docs/modules/tiles-3d/potree"}]}>

### [@loaders.gl/tiles-3d](./modules/tiles-3d/README.md)

Traverse spatial hierarchies and load selected portions of large 3D scenes and point clouds at appropriate levels of detail.


</PackageTile>

<PackageTile formats={[{"slug": "zip", "to": "/docs/modules/archives/zip"}, {"slug": "tar", "to": "/docs/modules/archives/tar"}]}>

### [@loaders.gl/archives](./modules/archives/README.md)

Access files inside archive containers, extract their contents, and write archives for storage or transfer.


</PackageTile>

<PackageTile formats={[{"slug": "xml", "to": "/docs/modules/documents/xml/formats/xml"}, {"slug": "yaml", "to": "/docs/modules/documents/config/formats/yaml"}, {"slug": "toml", "to": "/docs/modules/documents/config/formats/toml"}, {"slug": "bson", "to": "/docs/modules/documents/bson/formats/bson"}, {"slug": "markdown", "to": "/docs/modules/documents/formats/markdown"}]}>

### [@loaders.gl/documents](./modules/documents/README.md)

XML, HTML, YAML, TOML, BSON, and simple Markdown document loaders. The root contains metadata;
flat parser subpaths load implementations. Native BSON codecs also support Parquet BSON columns.

</PackageTile>

<PackageTile formats={[{"slug": "dot", "to": "/docs/modules/graphs"}, {"slug": "graphml", "to": "/docs/modules/graphs"}, {"slug": "gexf", "to": "/docs/modules/graphs"}]}>

### [@loaders.gl/graphs](./modules/graphs/README.md)

Turn graph documents into nodes, edges, and attributes for network analysis and visualization.


</PackageTile>

<PackageTile formats={[{"slug": "chrome-trace", "to": "/docs/modules/traces/formats/chrome-trace"}, {"slug": "perfetto-trace", "to": "/docs/modules/traces/formats/perfetto-trace"}, {"slug": "otlp-trace", "to": "/docs/modules/traces/formats/otlp-trace"}, {"slug": "jaeger-trace", "to": "/docs/modules/traces/formats/jaeger-trace"}, {"slug": "zipkin-trace", "to": "/docs/modules/traces/formats/zipkin-trace"}]}>

### [@loaders.gl/traces](./modules/traces/README.md)

Read browser, system, and distributed performance traces into structured tables for timeline visualization and analysis, with writers for supported formats.


</PackageTile>

<PackageTile formats={[{"slug": "splat", "to": "/docs/modules/splats/api-reference/splat-loader"}, {"slug": "ksplat", "to": "/docs/modules/splats/api-reference/ksplat-loader"}, {"slug": "spz", "to": "/docs/modules/splats/api-reference/spz-loader"}, {"slug": "rad", "to": "/docs/modules/splats"}]}>

### [@loaders.gl/splats](./modules/splats/README.md)

Load Gaussian splat scene data and its rendering attributes for reconstructing and displaying captured 3D environments.


</PackageTile>

<PackageTile formats={[{"slug": "wms", "to": "/docs/modules/ogc/wms"}, {"slug": "wfs", "to": "/docs/modules/ogc"}, {"slug": "wcs", "to": "/docs/modules/ogc"}, {"slug": "wmts", "to": "/docs/modules/ogc"}, {"slug": "csw", "to": "/docs/modules/ogc"}, {"slug": "ogc-api", "to": "/docs/modules/ogc"}, {"slug": "stac", "to": "/docs/modules/ogc/stac"}]}>

### [@loaders.gl/ogc](./modules/ogc/README.md)

Discover and access maps, features, coverage data, and catalog assets through geospatial standards and service protocols.


</PackageTile>

<PackageTile formats={[{"slug": "arcgis-feature-server", "to": "/docs/modules/arcgis/arcgis-feature-server"}, {"slug": "arcgis-map-server", "to": "/docs/modules/arcgis/arcgis-map-server"}, {"slug": "arcgis-image-server", "to": "/docs/modules/arcgis/arcgis-image-server"}, {"slug": "arcgis-vector-tile-server", "to": "/docs/modules/arcgis/arcgis-vector-tile-server"}, {"slug": "arcgis-scene-server", "to": "/docs/modules/arcgis/arcgis-scene-server"}]}>

### [@loaders.gl/arcgis](./modules/arcgis/README.md)

Access hosted map, feature, imagery, and scene data through ArcGIS REST services and portal resources.


</PackageTile>



<PackageTile formats={[{"slug": "image", "to": "/docs/modules/images/api-reference/image-loader"}, {"slug": "ktx", "to": "/docs/modules/images/textures/formats/ktx"}, {"slug": "basis", "to": "/docs/modules/images/textures/formats/basis"}, {"slug": "dds", "to": "/docs/modules/images/textures/formats/dds"}, {"slug": "pvr", "to": "/docs/modules/images/textures/formats/pvr"}, {"slug": "crunch", "to": "/docs/modules/images/textures/formats/crunch"}, {"slug": "video", "to": "/docs/modules/images/video/api-reference/video-loader"}, {"slug": "gif", "to": "/docs/modules/images/video"}]}>

### [@loaders.gl/images](./modules/images/README.md)

Decode and encode images, inspect image metadata, and work with textures and browser video APIs.
See [texture formats and APIs](./modules/images/textures/README.md) and [video loaders](./modules/images/video/README.md).


</PackageTile>


</PackageGrid>

## Utilities

<PackageGrid>

<PackageTile>

### [@loaders.gl/compression](./modules/compression/README.md)

Compression and decompression algorithms with selectable backends.

[Package reference](./modules/compression/README.md)

</PackageTile>

<PackageTile>

### [@loaders.gl/crypto](./modules/crypto/README.md)

Hashing, checksums, digest encoding, and worker support.

[Package reference](./modules/crypto/README.md)

</PackageTile>

<PackageTile>

### [@loaders.gl/sql](./modules/sql/README.md)

SQL data sources and optional database backends. Portable scan/query utilities live in core.

[Package reference](./modules/sql/README.md)

</PackageTile>

<PackageTile>

### [@loaders.gl/services](./modules/services/README.md)

Provider authentication presets for Mapbox, Google Maps and Cesium ion.

[Package reference](./modules/services/README.md)

</PackageTile>

</PackageGrid>

### Install packages, import subpaths

```bash
npm install @loaders.gl/core @loaders.gl/pointclouds @loaders.gl/scene
```

```typescript
import {parse, parseSync} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {PLYLoaderWithParser} from '@loaders.gl/pointclouds/ply-loader';

const points = await parse(plyBytes, PLYLoader);
const scene = await parse(gltfBytes, GLTFLoader);
const mesh = parseSync(plyBytes, PLYLoaderWithParser, {ply: {shape: 'mesh'}});
```

These metadata loaders preload their parser when passed to an async core API. Synchronous APIs require a parser-bearing implementation. Entrypoint contracts vary by package; follow the owning reference. See [Packages and format entrypoints](./developer-guide/grouped-packages.md) for the complete import and dependency model.

Subpaths are not separately installable packages. They control code loading; ordinary dependencies are installed for the whole package. Optional engines and codecs may need an additional installation. Worker and WASM assets must match the installed package version.

Core utilities are documented under core. Core implementations do not depend on domain packages. Specialized scan, arrow-geometry, geoarrow, and WKT utilities require explicit subpath imports. Geometry loaders and writers belong to geospatial; point-cloud tile traversal belongs to tiles-3d.

The private deck-layers workspace supports repository examples and is not a public package. The [tile-converter application](./modules/tile-converter/README.md) has its own documentation and distribution.
