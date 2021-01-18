# Geospatial Loaders

> The Geospatial category is experimental

Several geospatial formats return data in the form of lists of lng/lat encoded geometric objects.

## Geospatial Category Loaders

| Loader                                                   | Notes |
| -------------------------------------------------------- | ----- |
| [`GPXLoader`](modules/kml/docs/api-reference/gpx-loader) |       |
| [`KMLLoader`](modules/kml/docs/api-reference/kml-loader) |       |
| [`MVTLoader`](modules/mvt/docs/api-reference/mvt-loader) |       |
| [`TCXLoader`](modules/kml/docs/api-reference/tcx-loader) |       |
| [`WKTLoader`](modules/wkt/docs/api-reference/wkt-loader) |       |

## Data Format

## Data Structure

A JavaScript object with a number of top-level array-valued fields:

| Field           | Description                                          |
| --------------- | ---------------------------------------------------- |
| `points`        | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `lines`         | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `polygons`      | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `imageoverlays` | Urls and bounds of bitmap overlays                   |
| `documents`     |                                                      |
| `folders`       |                                                      |
| `links`         |                                                      |

### GeoJSON Conversion

Geospatial category data can be converted to GeoJSON (sometimes with a loss of information). Most geospatial applications can consume geojson.
