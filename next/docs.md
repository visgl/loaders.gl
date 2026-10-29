Library overview

# Big data loading for the web.

Load large files, streams, and cloud-hosted datasets in the browser or Node.js. Use one small API to parse, scan, transform, and write the formats your application needs.

This documentation describes loaders.gl **v5**. See our

<!-- -->

[release notes](https://loaders.gl/next/docs/whats-new.md) to learn what is new. Older versions:

<!-- -->

[v4.4](https://github.com/visgl/loaders.gl/blob/4.4-release/docs/README.md),

<!-- -->

[v3.3](https://github.com/visgl/loaders.gl/blob/3.3-release/docs/README.md),

<!-- -->

[v2.3](https://github.com/visgl/loaders.gl/blob/2.3-release/docs/README.md),

<!-- -->

[v1.3](https://github.com/visgl/loaders.gl/blob/1.3-release/docs/README.md).

[Get started](https://loaders.gl/next/docs/developer-guide/get-started.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/get-started.md)[Packages](https://loaders.gl/next/docs/packages.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/packages.md)[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

## Explore formats[​](#explore-formats "Direct link to Explore formats")

loaders.gl supports tabular, geospatial, 3D, texture, archive, and interchange formats. Official project logos are used where available. Other formats use simple name badges; OGC standards pair the OGC mark with the format name.

AllTablesGeospatialServicesTexturesPointcloudsMeshes

[![](/next/images/format-logos/apache-arrow-logo.png)Arrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md "Arrow")[BASISBasis](https://loaders.gl/next/docs/modules/textures/formats/basis.md "Basis")[![](/next/images/format-logos/bson-logo.png)BSON](https://loaders.gl/next/docs/modules/tables/bson/formats/bson.md "BSON")[![](/images/examples/traces/chrome.svg)Chrome TraceChrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md "Chrome Trace")[GPUCompressed Textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md "Compressed Textures")[![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md "COPC")[![](/next/images/format-logos/3d-tiles-logo.png)3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md "3D Tiles")[CrunchCrunch](https://loaders.gl/next/docs/modules/textures/formats/crunch.md "Crunch")[CSVCSV](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md "CSV")[![](/next/images/format-logos/ogc-mark.svg)OGCCSWCSW](https://loaders.gl/next/docs/modules/ogc/wms/formats/csw.md "CSW")[DDSDDS](https://loaders.gl/next/docs/modules/textures/formats/dds.md "DDS")[![](/next/images/format-logos/draco-logo.svg)Draco](https://loaders.gl/next/docs/modules/draco/formats/draco.md "Draco")[![](/next/images/format-logos/flatgeobuf-logo.png)FlatGeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md "FlatGeobuf")[![](/next/images/format-logos/geoarrow-logo.png)GeoArrowGeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md "GeoArrow")[GeoJSONGeoJSON](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md "GeoJSON")[![](/next/images/format-logos/toml-logo.svg)TOML](https://loaders.gl/next/docs/modules/config/formats/toml.md "TOML")[![](/next/images/format-logos/yaml-logo.svg)YAML](https://loaders.gl/next/docs/modules/config/formats/yaml.md "YAML")[![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackageGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md "GeoPackage")[GeoParquetGeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md "GeoParquet")[![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFFGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md "GeoTIFF")[![](/next/images/format-logos/gltf-logo.svg)GLBGLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md "GLB")[![](/next/images/format-logos/gltf-logo.svg)glTF](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md "glTF")[![](/next/images/format-logos/ogc-mark.svg)OGCGMLGML](https://loaders.gl/next/docs/modules/ogc/wms/formats/gml.md "GML")[GPXGPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md "GPX")[HDRRadiance HDR](https://loaders.gl/next/docs/modules/textures/formats/hdr.md "Radiance HDR")[HTMLHTML](https://loaders.gl/next/docs/modules/xml/formats/html.md "HTML")[![](/next/images/format-logos/ogc-mark.svg)OGCI3SI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md "I3S")[![](/next/images/format-logos/json-logo.gif)JSONJSON](https://loaders.gl/next/docs/modules/tables/json/formats/json.md "JSON")[![](/next/images/format-logos/ogc-mark.svg)OGCKMLKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md "KML")[![](/next/images/format-logos/ktx-logo.svg)KTX / KTX2](https://loaders.gl/next/docs/modules/textures/formats/ktx.md "KTX / KTX2")[LASLAS](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md "LAS")[LERCLERC](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md "LERC")[STYLEMap Style](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md "Map Style")[MLTMapLibre Tile](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md "MapLibre Tile")[MVTMVT](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md "MVT")[![](/next/images/format-logos/netcdf-logo.png)NetCDFNetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md "NetCDF")[OBJOBJ](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md "OBJ")[![](/next/images/format-logos/orc-logo.png)ORC](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md "ORC")[![](/next/images/format-logos/ogc-mark.svg)OGCOWS ContextOWS Context](https://loaders.gl/next/docs/modules/ogc/wms/formats/ows-context.md "OWS Context")[![](/next/images/format-logos/parquet-logo.png)Parquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md "Parquet")[![](/next/images/format-logos/perfetto-logo.png)PerfettoPerfetto Trace](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md "Perfetto Trace")[PCDPCD](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md "PCD")[PLYPLY](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md "PLY")[PMTilesPMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md "PMTiles")[PotreePotree](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md "Potree")[PVRPVR](https://loaders.gl/next/docs/modules/textures/formats/pvr.md "PVR")[SHPShapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md "Shapefile")[![](/next/images/format-logos/stac-logo.png)STACSTAC](https://loaders.gl/next/docs/modules/ogc/stac/formats/stac.md "STAC")[TCXTCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md "TCX")[TileJSONTileJSON](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md "TileJSON")[![](/next/images/format-logos/openusd-logo.svg)OpenUSDOpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md "OpenUSD")[![](/next/images/format-logos/ogc-mark.svg)OGCWKBWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md "WKB")[![](/next/images/format-logos/ogc-mark.svg)OGCWKTWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md "WKT")[![](/next/images/format-logos/ogc-mark.svg)OGCWKT-CRSWKT-CRS](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md "WKT-CRS")[XMLXML](https://loaders.gl/next/docs/modules/xml/formats/xml.md "XML")[![](/next/images/format-logos/zarr-logo.svg)Zarr](https://loaders.gl/next/docs/modules/scientific/zarr/formats/zarr.md "Zarr")[ZIPZIP](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md "ZIP")[![](/next/images/format-logos/ogc-mark.svg)OGCWCSWCS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md "WCS")[![](/next/images/format-logos/ogc-mark.svg)OGCWFSWFS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md "WFS")[![](/next/images/format-logos/ogc-mark.svg)OGCWMCWMC](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmc.md "WMC")[![](/next/images/format-logos/ogc-mark.svg)OGCWMSWMS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md "WMS")[![](/next/images/format-logos/ogc-mark.svg)OGCWMTSWMTS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md "WMTS")[![](/next/images/format-logos/ogc-mark.svg)OGCAPIOGC API Services](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md "OGC API Services")[![](/next/images/format-logos/arcgis-logo.jpg)FeatureArcGIS Feature Server](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-feature-server.md "ArcGIS Feature Server")[![](/next/images/format-logos/arcgis-logo.jpg)MapArcGIS MapServer](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-map-server.md "ArcGIS MapServer")[![](/next/images/format-logos/arcgis-logo.jpg)ImageArcGIS Image Server](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-image-server.md "ArcGIS Image Server")[![](/next/images/format-logos/arcgis-logo.jpg)Vector TileArcGIS VectorTileServer](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-vector-tile-server.md "ArcGIS VectorTileServer")[![](/next/images/format-logos/arcgis-logo.jpg)SceneArcGIS Scene Server](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-scene-server.md "ArcGIS Scene Server")[![](/next/images/format-logos/arcgis-logo.jpg)APIArcGIS API Reference](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md "ArcGIS API Reference")

The loaders.gl model

## Add formats. Your app just works.

Independent modules turn files, streams, services, and datasets into predictable data for JavaScript applications. Start with one format and add capabilities as the application grows.

01

Start with

load() for one complete result

02

Scale up with

loadInBatches() for incremental work

03

Common shapes

Tables, geometry, images, textures, and scenes

04

Install

Owner packages and the optional runtimes your formats need

## Start here[​](#start-here "Direct link to Start here")

Choose the loader that matches your data and use the same small set of APIs to load, stream, or write it. Related formats share owner packages. Install the packages you need and use their format subpaths to select APIs and defer parsers. The [Packages overview](https://loaders.gl/next/docs/packages.md) maps formats and utilities to their current owners.

![npm package](https://badge.fury.io/js/%40loaders.gl%2Fcore.svg)![MIT license](https://img.shields.io/badge/License-MIT-green.svg)![npm downloads](https://img.shields.io/npm/dm/@loaders.gl/core.svg)![TypeScript 6.0](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat-square)[![GitHub stars](https://img.shields.io/github/stars/visgl/loaders.gl.svg?style=flat-square\&label=%E2%98%85\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/loaders.gl)[![GitHub contributors](https://img.shields.io/github/contributors/visgl/loaders.gl.svg?style=flat-square)](https://github.com/visgl/loaders.gl/graphs/contributors)[![Coverage status](https://coveralls.io/repos/github/visgl/loaders.gl/badge.svg?branch=master)](https://coveralls.io/github/visgl/loaders.gl?branch=master)

[![OpenJS Foundation](https://raw.github.com/visgl/deck.gl-data/master/images/logos/openjsf-color-textg.png)](https://openvisualization.org)

*loaders.gl is an OpenJS Foundation / Linux Foundation project.*

Detailed guide

## The full library map

The guide below covers categories, packages, file formats, service sources, and the details behind the common APIs.

## Overview[​](#overview "Direct link to Overview")

loaders.gl is a collection of composable TypeScript modules for loading, scanning, transforming, and writing data in JavaScript applications. It covers tabular, geospatial, imagery, and 3D formats with consistent APIs for complete results, streamed batches, workers, and remote sources.

The modules are framework agnostic. Use them with any JavaScript application, or combine them with [vis.gl frameworks](https://vis.gl/frameworks) such as [**deck.gl**](https://deck.gl) when loaded data should be visualized.

## Loaders[​](#loaders "Direct link to Loaders")

loaders.gl provides a wide selection of loaders organized into categories:

| Category                                                                                         | Loaders                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Table Loaders](https://loaders.gl/next/docs/specifications/category-table.md)              | Streaming tabular loaders for [CSV](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md), [JSON](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md), [Parquet](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md), [Arrow](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md), and loaders that can return Arrow tables with `shape: 'arrow-table'`                                                                                                                                                |
| [Geospatial Loaders](https://loaders.gl/next/docs/specifications/category-gis.md)           | Loaders for formats such as [GeoJSON](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md), [KML](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md), [WKT/WKB](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md), and [Mapbox Vector Tiles](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md).                                                                                                                                                                                                    |
| [Image Loaders](https://loaders.gl/next/docs/specifications/category-image.md)              | Loaders for [images](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) and image utilities such as the [parsed image API](https://loaders.gl/next/docs/modules/images/api-reference/parsed-image-api.md) and [binary image API](https://loaders.gl/next/docs/modules/images/api-reference/binary-image-api.md).                                                                                                                                                                                                                                                                             |
| [Texture Loaders](https://loaders.gl/next/docs/specifications/category-texture.md)          | Loaders for [compressed textures](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md), [Basis textures](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md), and manifest-driven [texture loaders](https://loaders.gl/next/docs/modules/textures/api-reference/texture-loader.md) for arrays, cubemaps, and mip chains.                                                                                                                                                                                                                                      |
| [Pointcloud and Mesh Loaders](https://loaders.gl/next/docs/specifications/category-mesh.md) | Loaders for point cloud and simple mesh formats such as [Draco](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md), [LAS](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md), [PCD](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md), [PLY](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md), [OBJ](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md), and [Terrain](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/terrain-loader.md). |
| [Scenegraph Loaders](https://loaders.gl/next/docs/specifications/category-scenegraph.md)    | [glTF](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md) and [OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md) loaders                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [Tiled Data Loaders](https://loaders.gl/next/docs/specifications/category-3d-tiles.md)      | Loaders for tiled 3D data such as [3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md), [I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md), and [Potree](https://loaders.gl/next/docs/modules/tiles-3d/potree.md).                                                                                                                                                                                                                                                                                                                         |

## Code Examples[​](#code-examples "Direct link to Code Examples")

loaders.gl provides a small core API module with common functions to load and save data, and a range of optional modules that provide loaders and writers for specific file formats.

A minimal example using the `load` function and the `CSVLoader` to load a CSV file into an object-row table:

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await load('data.csv', CSVLoader, {csv: {shape: 'object-row-table'}});



if (table.shape === 'object-row-table') {

  for (const row of table.data) {

    console.log(row);

  }

}
```

Streaming parsing is available using ES2018 async iterators, e.g. allowing "larger than memory" files to be incrementally processed:

```
import {loadInBatches} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



for await (const batch of await loadInBatches('data.csv', CSVLoader, {csv: {shape: 'object-row-table'}})) {

  if (batch.batchType === 'data' && Array.isArray(batch.data)) {

    for (const row of batch.data) {

      console.log(JSON.stringify(row)); // => '{header1: value1, header2: value2}'

    }

  }

}
```

To quickly get up to speed on how the loaders.gl API works, see [Get Started](https://loaders.gl/next/docs/developer-guide/get-started.md).

## Supported Platforms[​](#supported-platforms "Direct link to Supported Platforms")

| Runtime            | Support                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| Evergreen browsers | ✅ Current Chrome, Firefox, and Safari releases on desktop and mobile        |
| Node.js            | ✅ All current [LTS releases](https://nodejs.org/en/about/previous-releases) |

## Design Goals[​](#design-goals "Direct link to Design Goals")

| Goal                 | What it means in practice                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Arrow support        | Expose Arrow tables and record batches in supported tabular loaders for columnar processing.            |
| Binary-first data    | Preserve compact typed arrays and binary buffers without adding WebGL dependencies.                     |
| Streaming            | Process async input and parsed batches incrementally, including inputs larger than memory.              |
| Worker-ready parsing | Move expensive decoders to prebuilt workers when a module provides them.                                |
| Loader categories    | Normalize related formats into shared application-facing data shapes.                                   |
| Multi-asset loading  | Resolve linked buffers, images, tiles, and texture levels through one loading path.                     |
| Format autodetection | Select loaders from extensions, MIME types, and initial bytes when the input allows it.                 |
| Composable bundles   | Publish independent modules and lazy runtimes so applications can install what they use.                |
| Modern JavaScript    | Use TypeScript, ECMAScript modules, `ArrayBuffer`, and async iterators as portable primitives.          |
| Framework agnostic   | Return documented objects, typed arrays, tables, and batches that any JavaScript framework can consume. |
| Browser and Node.js  | Keep the same core APIs usable in browsers, services, scripts, and tests.                               |

## Licenses[​](#licenses "Direct link to Licenses")

loaders.gl itself is MIT licensed. Some modules include adapted code under compatible permissive licenses such as ISC, BSD, or Apache 2. Each module documents its own attributions and license boundary. Data, imagery and service content have separate terms.

## Credits and Attributions[​](#credits-and-attributions "Direct link to Credits and Attributions")

loaders.gl is maintained by a group of organizations collaborating through open governance under the OpenJS and Linux Foundations.

While loaders.gl contains substantial amounts of original code, it also repackages lots of superb work done by others in the open source community. We try to be as explicit as we can about the origins and attributions of each piece of code, both in the documentation page for each module and in the preservation of comments relating to authorship and contributions inside forked source code.

Even so, we can make mistakes, and we may not have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know.

See [References and credits](https://loaders.gl/next/docs/references-and-credits.md) for named authors, implementation lineage, specifications, fixture provenance and package notice inventories.

## Organizational support[​](#organizational-support "Direct link to Organizational support")

Organizations that have contributed significantly to the development and maintenance of loaders.gl:

[![Foursquare](/next/images/supporters/foursquare.svg)](https://studio.foursquare.com)[![CARTO](/next/images/supporters/carto.svg)](https://carto.com)[![Action Engine](/next/images/supporters/action-engine.svg)](https://actionengine.com)[![Esri](/next/images/supporters/esri.jpg)](https://esri.com)[![Uber](/next/images/supporters/uber.png)](https://uber.com)

## Open Governance[​](#open-governance "Direct link to Open Governance")

loaders.gl is a part of the [**vis.gl framework suite**](https://vis.gl), an open governance Linux Foundation project that is developed collaboratively by multiple organizations and individuals and the Urban Computing Foundation.

[![](https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/logos/openjsf-color-textg.png)![](https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/logos/vis-logo.png)](https://vis.gl)

See [Packages](https://loaders.gl/next/docs/packages.md) to choose format packages and understand their public subpaths.
