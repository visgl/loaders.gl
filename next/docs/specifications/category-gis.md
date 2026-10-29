Loader category

# Geospatial loaders

Keep coordinates, attributes, and geometry together while moving between file formats, services, and rendering-oriented data shapes.

[Coordinate reference systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)[Converting data](https://loaders.gl/next/docs/developer-guide/converting-data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converting-data.md)

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[GeoJSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[Flat​Geobuf​Loader↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[Geo​Package​Loader↗](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)[GPX​Loader↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[KML​Loader↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[MVT​Loader↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)[Shapefile​Loader↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[SHP​Loader↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)[TCX​Loader↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)[WKB​Loader↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)[WKT​Loader↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)

Data

[GIS category dataFeatures / geometry↗](https://loaders.gl/next/docs/specifications/category-gis.md)

Encode

[GeoJSON​Writer↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)[MVT​Writer↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-writer.md)[WKB​Writer↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-writer.md)[WKT​Writer↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-writer.md)[TWKB​Writer↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-writer.md)

The geospatial path

## Keep coordinates, geometry, and attributes together.

Geospatial loaders differ in how they store geometry and how much metadata they carry. The shared category gives applications familiar feature, geometry, and table shapes while each format keeps its own strengths.

01

Features

Geometry and properties in a feature-oriented shape

02

Geometry

Single WKT, WKB, or GeoJSON geometry values

03

Tables

Typed columns with GeoArrow metadata where supported

04

Services

Remote features, tiles, rasters, and scene data

The category includes local files, cloud-native vector formats, and remote services. Some loaders return one geometry, some return layers of features, and others expose a table that can move into scans or render-oriented converters. Check the format page when CRS, indexing, or layer behavior is important.

Detailed guide

## Geospatial shapes and contracts

The reference below records loader outputs, shape selection, geometry representations, layer handling, and conversion boundaries.

## Geospatial Category Loaders[​](#geospatial-category-loaders "Direct link to Geospatial Category Loaders")

The default geospatial table representation is Arrow for the loaders below. Each loader reference documents its alternate shapes and format-specific fields.

| Loader                                                                                                                                                                                                                                                                                                        | Default result   | Scope                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| [`GPXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md), [`KMLLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md), [`TCXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md) | `ArrowTable`     | Features from XML documents.                      |
| [`GeoJSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)                                                                                                                                                                                                      | `ArrowTable`     | GeoJSON features.                                 |
| [`ShapefileLoader`](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)                                                                                                                                                                                         | `ArrowTable`     | Features joined from geometry and property files. |
| `SHPLoader`                                                                                                                                                                                                                                                                                                   | `ArrowTable`     | Geometry-only shapefile records.                  |
| [`FlatGeobufLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)                                                                                                                                                                                      | `ArrowTable`     | Features from a FlatGeobuf file.                  |
| [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)                                                                                                                                                                                                                | `ArrowTable`     | Features from selected vector-tile layers.        |
| [`GeoPackageLoader`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)                                                                                                                                                                                      | `ArrowTable`     | Features from a selected table.                   |
| [`WKBLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md), [`WKTLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)                                                                                                      | GeoJSON geometry | One geometry, without a feature/property wrapper. |

## Supported shapes[​](#supported-shapes "Direct link to Supported shapes")

For loaders with shape selection, `options.core.shape` sets the default return shape and `options[loaderId].shape` takes precedence.

| Shape                       | Loaders                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Notes                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `geojson-table`             | `GeoJSONLoader`, [`FlatGeobufLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md), [`GeoPackageLoader`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md), [`GPXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md), [`KMLLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md), [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md), `ShapefileLoader`, [`TCXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md) | Shared feature-table target. Loader-specific overrides stay under each loader id, e.g. `options.mvt.shape`. |
| `arrow-table`               | `GeoJSONLoader`, [`FlatGeobufLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md), `ShapefileLoader`, `SHPLoader`, `DBFLoader`, [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md), [`MVTSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md), [`GeoPackageLoader`](https://loaders.gl/next/docs/modules/geospatial/geopackage/api-reference/geopackage-loader.md)                                                                                                                                                                         | GeoArrow-compatible Arrow table output with WKB or typed geometry metadata where supported.                 |
| `binary-feature-collection` | `GeoJSONLoader`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Deck.gl-style binary feature collection output selected with `options.geojson.shape`.                       |
| `object-row-table`          | [`GPXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md), [`KMLLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md), [`TCXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)                                                                                                                                                                                                                                                                                                                                                                                         | Feature rows as plain objects.                                                                              |
| `columnar-table`            | [`FlatGeobufLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md), [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Column-major geospatial output.                                                                             |
| `geojson`                   | [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md), `MLTLoader`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Array of GeoJSON features instead of a table wrapper.                                                       |
| `binary`                    | [`FlatGeobufLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md), [`GPXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md), [`KMLLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md), [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md), `MLTLoader`, [`TCXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)                                                                                                                                                  | Binary feature representations vary by loader.                                                              |
| `binary-geometry`           | [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Geometry-only binary output.                                                                                |
| `geojson-geometry`          | [`WKBLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md), [`WKTLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Single geometry output.                                                                                     |
| `raw`                       | [`GPXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md), [`KMLLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md), [`TCXLoader`](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)                                                                                                                                                                                                                                                                                                                                                                                         | Raw parsed XML/document output where supported.                                                             |
| `v3`                        | `ShapefileLoader`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Legacy shapefile feature array shape.                                                                       |

## Data Format[​](#data-format "Direct link to Data Format")

For geospatial formats that contain a single layer:

* `category`: `string` - `gis`
* `schema?`: `Schema` - Apache Arrow style schema
* `data`: `*` - Data is formatted according to `options.gis.format`
* `format`: `string` - The encoding of `data` layers, corresponds to `options.gis.format`.
* `loaderMetadata?`: `object` - Loader specific metadata, see documentation for each loader

For geospatial loaders that contain multiple layers:

* `category`: `string` - `gis-layers`
* `layers`: A map of layers keyed by layer names. Each layer is formatted according to `options.gis.format`
* `loaderMetadata?`: `object` - Top-level loader specific metadata, see documentation for each loader

For geospatial loaders that contain a single geometry:

* `category`: `string` - `gis-geometry`
* `schema?`: `Schema` - Apache Arrow style schema
* `data`: `*` - Data is formatted according to `options.gis.format`
* `format`: `string` - The encoding of `data` layers, corresponds to `options.gis.format`.

## Conversion Shapes[​](#conversion-shapes "Direct link to Conversion Shapes")

loaders.gl currently converts GIS data between several related shapes:

| Shape                             | Family                               | Typical producer                            |
| --------------------------------- | ------------------------------------ | ------------------------------------------- |
| `geojson`                         | feature collection                   | JSON, KML, GPX, shapefile, MVT              |
| `flat-geojson`                    | flattened feature collection         | GIS conversion utilities                    |
| `binary-feature-collection`       | render-oriented feature collection   | GIS conversion utilities, deck.gl pipelines |
| `arrow-binary-feature-collection` | Arrow-backed render-oriented wrapper | GIS conversion utilities                    |
| `geojson-geometry`                | single geometry                      | WKB/WKT/TWKB converters                     |
| `wkb`, `wkt`, `twkb`              | geometry wire formats                | WKT/WKB loaders and GIS geometry converters |
| `geoarrow` and `geoarrow.*`       | Arrow + GeoArrow metadata            | GeoArrow loaders and converters             |

See the converter docs for details:

* [Converting data](https://loaders.gl/next/docs/developer-guide/converting-data.md)
* [GeoArrow converters](https://loaders.gl/next/docs/developer-guide/converters/geoarrow-converters.md)
* [Render converters](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md)
* [Format categories](https://loaders.gl/next/docs/developer-guide/converters/format-categories.md)

## Data structures[​](#data-structures "Direct link to Data structures")

### GeoJSON[​](#geojson "Direct link to GeoJSON")

A GeoJSON table wraps a `FeatureCollection` with its shape and schema metadata. Features contain a `geometry` and a `properties` object. Geometry-only loaders return a geometry without the feature wrapper.

### Binary[​](#binary "Direct link to Binary")

Render-oriented binary feature collections group geometry into `points`, `lines`, and `polygons`. These fields contain typed coordinate, index, feature-ID, and property buffers; they are not GeoJSON `FeatureCollection` objects. Other binary shapes differ by loader, so check the requested shape's reference.

### Raw[​](#raw "Direct link to Raw")

Raw output preserves format-specific structures and is not a shared geospatial contract. Use it only when your application needs fields that a normalized table cannot represent.

### GeoJSON Conversion[​](#geojson-conversion "Direct link to GeoJSON Conversion")

Geospatial category data can be converted to GeoJSON (sometimes with a loss of information). Most geospatial applications can consume geojson.

## Multi-Geometries And GeometryCollection[​](#multi-geometries-and-geometrycollection "Direct link to Multi-Geometries And GeometryCollection")

For render-oriented binary conversion:

* `MultiPoint` is mapped into the `points` bin
* `MultiLineString` is mapped into the `lines` bin
* `MultiPolygon` is mapped into the `polygons` bin
* `GeometryCollection` is flattened recursively into those same bins

The source feature identity is preserved through feature id arrays.
