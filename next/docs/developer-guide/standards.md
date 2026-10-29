Standards and organizations

![](/next/images/format-logos/ogc-mark.svg)OGCAPI![](/next/images/format-logos/gltf-logo.svg)![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)![](/next/images/format-logos/arcgis-logo.jpg)API

# loaders.gl ♥ standards

Big-data applications should be able to choose open formats without rebuilding their loading path. loaders.gl implements standards deeply, exposes the boundaries honestly, and keeps the application-facing shapes portable.

versionsprofilescapabilities

formatversion

profilecapability

boundarycontract

[All formats](https://loaders.gl/next/docs/formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/formats.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

Standards at the boundary

## Keep the specification visible.

A format, protocol, or CRS definition keeps its own version and profile. loaders.gl adds a practical API around it without flattening those distinctions into a vague support claim.

Standards

[FormatsGeoJSON · GeoTIFF · 3D Tiles↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[ProtocolsWMS · WFS · STAC↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[DefinitionsCRS · profiles · versions↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

describ&#x65;**→**

contract

Exact support

version · profile · capability · boundary

expos&#x65;**→**

Application surface

[Loaders and writersdecode and encode↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)[Sourcesmetadata and requests↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[Category datastable application shapes↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

Follow each entry point for the implemented capability, and keep unsupported edges explicit.

What support means here

## Implement the standard. Keep the boundary visible.

A standards logo is useful only when readers can discover the loader, writer, source, version, and unsupported edge behind it. The catalog below links directly to those implementation pages.

01

Decode

Load standards-shaped files and service responses

02

Encode

Write compatible formats where a writer is implemented

03

Discover

Read metadata before requesting large payloads

04

Compose

Move results through common table, mesh, scene, and tile shapes

Implemented catalog

## Standards by workload

Start with the kind of data you have. Every link lands on the loaders.gl page that records the real implementation boundary.

Scenes, meshes, textures

### 3D and graphics

Portable scene, tiled-world, point-cloud, mesh-compression, and GPU texture formats.

[glTF / GLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[I3S / SLPK](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[Draco](https://loaders.gl/next/docs/modules/draco/formats/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[KTX / KTX2](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)[Basis](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)[LAS / LAZ](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

Typed data at scale

### Columnar and analytical

Formats that preserve schemas, columns, batches, and cloud-selective layouts.

[Apache Arrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[Apache Parquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[Apache Avro](https://loaders.gl/next/examples/table/avro)

<!-- -->

[ ↗](https://loaders.gl/next/examples/table/avro)[Apache ORC](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md)[Apache Iceberg](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md)

Portable spatial data

### Geospatial files

Interoperable feature, raster, catalog, geometry, and archive formats.

[GeoJSON](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[KML / KMZ](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[GeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[GeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[FlatGeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Shapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[WKT / WKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)[WKT-CRS](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)[STAC](https://loaders.gl/next/docs/modules/ogc/stac/formats/stac.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/stac/formats/stac.md)

Metadata plus requests

### Network services

Standards and vendor APIs where discovery is followed by bounded requests.

[WMS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)[WMTS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md)[WFS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md)[WCS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)[CSW](https://loaders.gl/next/docs/modules/ogc/wms/formats/csw.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/csw.md)[OGC API](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md)[ArcGIS REST](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)

Ecosystem map

## Organizations

The same catalog grouped by the communities and standards bodies that define or steward it.

Open data systems

### Apache

Binary table, storage, serialization, and table-catalog projects used by large-data pipelines.

[Arrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Parquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Avro](https://loaders.gl/next/examples/table/avro)

<!-- -->

[ ↗](https://loaders.gl/next/examples/table/avro)[ORC](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/orc/formats/orc.md)[Iceberg](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md)

Portable 3D and GPU assets

### Khronos

Scene and texture standards designed to move renderable assets between tools and runtimes.

[glTF](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[GLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)[KTX / KTX2](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)[Basis in glTF](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#khr_texture_basisu)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#khr_texture_basisu)

Open geospatial interoperability

### OGC

File formats, geometry models, coordinate descriptions, tiled scenes, and web-service protocols.

[3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[GeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)[GeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[KML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[GML](https://loaders.gl/next/docs/modules/ogc/wms/formats/gml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/gml.md)[WKT / WKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)[Web services](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)

Scene and mapping services

### Esri / ArcGIS

Scene layers, raster compression, and ArcGIS REST services connected to common loaders.gl sources.

[I3S / SLPK](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[LERC](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md)[FeatureServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)[MapServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)[ImageServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)[VectorTileServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)[SceneServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-scene-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-scene-server.md)

Internet and point-cloud standards

### IETF, ASPRS, Cesium, AOUSD

Important specifications stewarded outside the four largest format families.

[IETF GeoJSON](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[ASPRS LAS / LAZ](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Cesium 3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[AOUSD OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)[COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

Detailed guide

## Conformance lives with each format

Follow a format link for supported versions, profiles, extensions, loader and writer entry points, test-backed capabilities, and known gaps. The catalog is a map—not a blanket conformance claim.

Support descriptions deliberately distinguish complete, partial, developing, and unsupported capabilities. When a specification is still evolving—such as draft glTF 2.1 features—the format page identifies the implemented draft surface and the tests that protect it.
