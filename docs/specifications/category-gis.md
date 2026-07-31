# Geospatial Loaders

> The Geospatial category is experimental

Several geospatial formats return data in the form of lists of lng/lat encoded geometric objects.

## Geospatial Category Loaders

| Loader                                                    | Type   | `geojson`                               | `binary`          | `raw`      | `batch`         | comments |
| --------------------------------------------------------- | ------ | --------------------------------------- | ----------------- | ---------- | --------------- | -------- |
| [`GPXLoader`](/docs/modules/kml/api-reference/gpx-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`KMLLoader`](/docs/modules/kml/api-reference/kml-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`TCXLoader`](/docs/modules/kml/api-reference/tcx-loader) |        | `FeatureCollection`                     | attributes object | parsed XML |
| `GeoJSONLoader`                                           |        | `FeatureCollection`                     |
| `ShapefileLoader`                                         |        | `FeatureCollection`                     | attributes object | -          |                 |
| `SHPLoader`                                               |        | `FeatureCollection`                     | attributes object | -          | only geometries |
| `FlatGeobufLoader`                                        |        | `FeatureCollection`                     | -                 | -          |
| [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) | Layers | `FeatureCollections`                    |
| `GeoPackageLoader`                                        | Layers | `FeatureCollections`                    | -                 | -          |
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
