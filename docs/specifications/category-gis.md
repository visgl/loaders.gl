# Category: GIS

Many geospatial formats can be converted to GeoJSON (sometimes with a loss of some information). Since most geospatial applications can consume geojson, it can make sense to provide a GeoJSON conversion option for geospatial loaders.

## Data Structure

A JavaScript object with a number of top-level array-valued fields:

| Field           | Description                        |
| --------------- | ---------------------------------- |
| `documents`     |                                    |
| `folders`       |                                    |
| `links`         |                                    |
| `points`        | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `lines`         | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `polygons`      | A [GeoJson](https://geojson.org/) FeatureCollection. |
| `imageoverlays` | Urls and bounds of bitmap overlays |


## Loaders

- [KMLLoader](/docs/api-reference/kml/kml-loader)

