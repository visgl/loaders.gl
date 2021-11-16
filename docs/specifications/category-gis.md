# Geospatial Loaders

> The Geospatial category is experimental

Several geospatial formats return data in the form of lists of lng/lat encoded geometric objects.

## Geospatial Category Loaders

| Loader                                                   | Type   | `geojson`                               | `binary`          | `raw`      | `batch`         | comments |
| -------------------------------------------------------- | ------ | --------------------------------------- | ----------------- | ---------- | --------------- | -------- |
| [`GPXLoader`](modules/kml/docs/api-reference/gpx-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`KMLLoader`](modules/kml/docs/api-reference/kml-loader) | Layers | `FeatureCollection`                     | attributes object | parsed XML |
| [`TCXLoader`](modules/kml/docs/api-reference/tcx-loader) |        | `FeatureCollection`                     | attributes object | parsed XML |
| `GeoJSONLoader`                                          |        | `FeatureCollection`                     |
| `ShapefileLoader`                                        |        | `FeatureCollection`                     | attributes object | -          |                 |
| `SHPLoader`                                              |        | `FeatureCollection`                     | attributes object | -          | only geometries |
| `FlatGeobufLoader`                                       |        | `FeatureCollection`                     | -                 | -          |
| [`MVTLoader`](modules/mvt/docs/api-reference/mvt-loader) | Layers | `FeatureCollections`                    |
| `GeoPackageLoader`                                       | Layers | `FeatureCollections`                    | -                 | -          |
| [`WKBLoader`](modules/wkt/docs/api-reference/wkb-loader) | Single | a single geojson geometry (not feature) | -                 | -          | only geometry   |
| [`WKTLoader`](modules/wkt/docs/api-reference/wkt-loader) | Single | a single geojson geometry (not feature) | -                 | -          | only geometry   |

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
