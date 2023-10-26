# Geometries


## GeoJSONTable

The `GeoJSONTable` is one of the standard data return formats from loaders.gl loaders. 
It is a GeoJSON FeatureCollection with two extra fields (`shape` and `schema`)


## Binary Geometries

loaders.gl defines a Binary Geometry Format.

The format is designed to work directly with the binary support in deck.gl layers.

This format is currently described in more detail in the `@loaders.gl/gis` module documentation.

##

## Tesselation

Some loaders can perform tesselation. 

This is typically done with earcut, which is a very fast polygon tesselator. The drawback with 

There can also be problems if polygons have very large numbers of holes.

