---
title: Geospatial Loaders
description: Read geospatial formats into shared feature, geometry, and table shapes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {CategoryDataConcept} from '@site/src/components/home/concepts';

<DocPageHeader
  eyebrow="Loader category"
  title="Geospatial loaders"
  description="Keep coordinates, attributes, and geometry together while moving between file formats, services, and rendering-oriented data shapes."
  tone="orange"
  meta={['Features and geometry', 'CRS-aware', 'GIS and tile formats']}
  links={[
    {label: 'Coordinate reference systems', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'Converting data', to: '/docs/developer-guide/converting-data'}
  ]}
/>

<CategoryDataConcept initialCategoryId="gis" initialRepresentationId="plain" />

<DocOrientation
  eyebrow="The geospatial path"
  title="Keep coordinates, geometry, and attributes together."
  description="Geospatial loaders differ in how they store geometry and how much metadata they carry. The shared category gives applications familiar feature, geometry, and table shapes while each format keeps its own strengths."
  tone="orange"
  items={[
    {label: 'Features', value: 'Geometry and properties in a feature-oriented shape'},
    {label: 'Geometry', value: 'Single WKT, WKB, or GeoJSON geometry values'},
    {label: 'Tables', value: 'Typed columns with GeoArrow metadata where supported'},
    {label: 'Services', value: 'Remote features, tiles, rasters, and scene data'}
  ]}
/>

The category includes local files, cloud-native vector formats, and remote services. Some loaders
return one geometry, some return layers of features, and others expose a table that can move into
scans or render-oriented converters. Check the format page when CRS, indexing, or layer behavior is
important.

<ReferenceBoundary
  title="Geospatial shapes and contracts"
  description="The reference below records loader outputs, shape selection, geometry representations, layer handling, and conversion boundaries."
  tone="orange"
/>

## Geospatial Category Loaders

The default geospatial table representation is Arrow for the loaders below.
Each loader reference documents its alternate shapes and format-specific fields.

| Loader | Default result | Scope |
| --- | --- | --- |
| [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader), [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader), [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | `ArrowTable` | Features from XML documents. |
| [`GeoJSONLoader`](/docs/modules/json/api-reference/geojson-loader) | `ArrowTable` | GeoJSON features. |
| [`ShapefileLoader`](/docs/modules/shapefile/api-reference/shapefile-loader) | `ArrowTable` | Features joined from geometry and property files. |
| `SHPLoader` | `ArrowTable` | Geometry-only shapefile records. |
| [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader) | `ArrowTable` | Features from a FlatGeobuf file. |
| [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) | `ArrowTable` | Features from selected vector-tile layers. |
| [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader) | `ArrowTable` | Features from a selected table. |
| [`WKBLoader`](/docs/modules/wkt/api-reference/wkb-loader), [`WKTLoader`](/docs/modules/wkt/api-reference/wkt-loader) | GeoJSON geometry | One geometry, without a feature/property wrapper. |

## Supported shapes

For loaders with shape selection, `options.core.shape` sets the default return shape and `options[loaderId].shape` takes precedence.

| Shape | Loaders | Notes |
| --- | --- | --- |
| `geojson-table` | `GeoJSONLoader`, [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader), [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader), [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader), [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader), [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader), `ShapefileLoader`, [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | Shared feature-table target. Loader-specific overrides stay under each loader id, e.g. `options.mvt.shape`. |
| `arrow-table` | `GeoJSONLoader`, [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader), `ShapefileLoader`, `SHPLoader`, `DBFLoader`, [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader), [`MVTSourceLoader`](/docs/modules/mvt/api-reference/mvt-source-loader), [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader) | GeoArrow-compatible Arrow table output with WKB or typed geometry metadata where supported. |
| `binary-feature-collection` | `GeoJSONLoader` | Deck.gl-style binary feature collection output selected with `options.geojson.shape`. |
| `object-row-table` | [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader), [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader), [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | Feature rows as plain objects. |
| `columnar-table` | [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader), [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) | Column-major geospatial output. |
| `geojson` | [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader), `MLTLoader` | Array of GeoJSON features instead of a table wrapper. |
| `binary` | [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader), [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader), [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader), [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader), `MLTLoader`, [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | Binary feature representations vary by loader. |
| `binary-geometry` | [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) | Geometry-only binary output. |
| `geojson-geometry` | [`WKBLoader`](/docs/modules/wkt/api-reference/wkb-loader), [`WKTLoader`](/docs/modules/wkt/api-reference/wkt-loader) | Single geometry output. |
| `raw` | [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader), [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader), [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | Raw parsed XML/document output where supported. |
| `v3` | `ShapefileLoader` | Legacy shapefile feature array shape. |

## Data Format

For geospatial formats that contain a single layer:

- `category`: `string` - `gis`
- `schema?`: `Schema` - Apache Arrow style schema
- `data`: `*` - Data is formatted according to `options.gis.format`
- `format`: `string` - The encoding of `data` layers, corresponds to `options.gis.format`.
- `loaderMetadata?`: `object` - Loader specific metadata, see documentation for each loader

For geospatial loaders that contain multiple layers:

- `category`: `string` - `gis-layers`
- `layers`: A map of layers keyed by layer names. Each layer is formatted according to `options.gis.format`
- `loaderMetadata?`: `object` - Top-level loader specific metadata, see documentation for each loader

For geospatial loaders that contain a single geometry:

- `category`: `string` - `gis-geometry`
- `schema?`: `Schema` - Apache Arrow style schema
- `data`: `*` - Data is formatted according to `options.gis.format`
- `format`: `string` - The encoding of `data` layers, corresponds to `options.gis.format`.

## Conversion Shapes

loaders.gl currently converts GIS data between several related shapes:

| Shape | Family | Typical producer |
| --- | --- | --- |
| `geojson` | feature collection | JSON, KML, GPX, shapefile, MVT |
| `flat-geojson` | flattened feature collection | GIS conversion utilities |
| `binary-feature-collection` | render-oriented feature collection | GIS conversion utilities, deck.gl pipelines |
| `arrow-binary-feature-collection` | Arrow-backed render-oriented wrapper | GIS conversion utilities |
| `geojson-geometry` | single geometry | WKB/WKT/TWKB converters |
| `wkb`, `wkt`, `twkb` | geometry wire formats | WKT/WKB loaders and GIS geometry converters |
| `geoarrow` and `geoarrow.*` | Arrow + GeoArrow metadata | GeoArrow loaders and converters |

See the converter docs for details:

- [Converting data](/docs/developer-guide/converting-data)
- [GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters)
- [Render converters](/docs/developer-guide/converters/render-converters)
- [Format categories](/docs/developer-guide/converters/format-categories)

## Data structures

### GeoJSON

A GeoJSON table wraps a `FeatureCollection` with its shape and schema metadata.
Features contain a `geometry` and a `properties` object. Geometry-only loaders
return a geometry without the feature wrapper.

### Binary

Render-oriented binary feature collections group geometry into `points`, `lines`,
and `polygons`. These fields contain typed coordinate, index, feature-ID, and
property buffers; they are not GeoJSON `FeatureCollection` objects. Other binary
shapes differ by loader, so check the requested shape's reference.

### Raw

Raw output preserves format-specific structures and is not a shared geospatial
contract. Use it only when your application needs fields that a normalized table
cannot represent.

### GeoJSON Conversion

Geospatial category data can be converted to GeoJSON (sometimes with a loss of information). Most geospatial applications can consume geojson.

## Multi-Geometries And GeometryCollection

For render-oriented binary conversion:

- `MultiPoint` is mapped into the `points` bin
- `MultiLineString` is mapped into the `lines` bin
- `MultiPolygon` is mapped into the `polygons` bin
- `GeometryCollection` is flattened recursively into those same bins

The source feature identity is preserved through feature id arrays.
