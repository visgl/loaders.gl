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
