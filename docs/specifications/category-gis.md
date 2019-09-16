# Category: GIS

> The GIS category is highly experimental and may be removed in a future release

Several geospatial formats return data in the form of lists of lng/lat encoded geometric objects.

## GeoJSON Conversion

GIS category data can be converted to GeoJSON (sometimes with a loss of information). Most geospatial applications can consume geojson.

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

## Loaders

- [KMLLoader](/docs/api-reference/kml/kml-loader)
