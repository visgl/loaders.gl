# Geospatial Loaders

> The Geospatial category is experimental

Several geospatial formats return data in the form of lists of lng/lat encoded geometric objects.

## Geospatial Category Loaders

| Loader                                                   | Notes |
| -------------------------------------------------------- | ----- |
| [`KMLLoader`](modules/kml/docs/api-reference/kml-loader) |       |
| [`WKTLoader`](modules/wkt/docs/api-reference/wkt-loader) |       |
| [`MVTLoader`](modules/mvt/docs/api-reference/mvt-loader) |       |

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
