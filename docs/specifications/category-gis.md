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

| Loader                                                    | Type   | `geojson`                               | `binary`          | `raw`      | `batch`         | comments |
| --------------------------------------------------------- | ------ | --------------------------------------- | ----------------- | ---------- | --------------- | -------- |
| [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`GeoJSONLoader`](/docs/modules/json/api-reference/geojson-loader) |        | `FeatureCollection`                     |
| [`ShapefileLoader`](/docs/modules/shapefile/api-reference/shapefile-loader) |        | `FeatureCollection`                     | attributes object | -          |
| `SHPLoader`                                               |        | `FeatureCollection`                     | attributes object | -          | only geometries |
| [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader) |        | `FeatureCollection`                     | -                 | -          |
| [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) | Layers | `FeatureCollections`                    |
| [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader) | Layers | `FeatureCollections`                    | -                 | -          |
| [`WKBLoader`](/docs/modules/wkt/api-reference/wkb-loader) | Single | a single geojson geometry (not feature) | -                 | -          | only geometry   |
| [`WKTLoader`](/docs/modules/wkt/api-reference/wkt-loader) | Single | a single geojson geometry (not feature) | -                 | -          | only geometry   |

## Supported shapes

For loaders with shape selection, `options.core.shape` sets the default return shape and `options[loaderId].shape` takes precedence.

| Shape | Loaders | Notes |
| --- | --- | --- |
| `geojson-table` | `GeoJSONLoader`, [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader), [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader), [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader), [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader), [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader), `ShapefileLoader`, [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) | Shared feature-table target. Loader-specific overrides stay under each loader id, e.g. `options.mvt.shape`. |
| `arrow-table` | `GeoJSONLoader`, [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader) | GeoArrow-compatible Arrow table output with WKB geometry metadata where supported. |
| `binary-feature-collection` | `GeoJSONLoader` | Deck.gl-style binary feature collection output selected with `options.geojson.shape`. |
| `tables` | [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader) | Default GeoPackage output. |
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

## Data Structure

### GeoJSON

### Binary

A JavaScript object with a number of top-level array-valued fields:

| Field      | Description                                          |
| ---------- | ---------------------------------------------------- |
| `points`   | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `lines`    | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `polygons` | A [GeoJson](https://geojson.org/) FeatureCollection. |

### Raw

### GeoJSON Conversion

Geospatial category data can be converted to GeoJSON (sometimes with a loss of information). Most geospatial applications can consume geojson.

## Multi-Geometries And GeometryCollection

For render-oriented binary conversion:

- `MultiPoint` is mapped into the `points` bin
- `MultiLineString` is mapped into the `lines` bin
- `MultiPolygon` is mapped into the `polygons` bin
- `GeometryCollection` is flattened recursively into those same bins

The source feature identity is preserved through feature id arrays.
