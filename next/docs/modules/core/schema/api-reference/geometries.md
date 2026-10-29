Schema module · geometry data

# Geometries

loaders.gl provides several geometry representations so geospatial data can move from format decoders to maps, analysis code, and binary rendering paths.

[Schema module](https://loaders.gl/next/docs/modules/core/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema.md)[GeoArrow module](https://loaders.gl/next/docs/modules/core/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/geoarrow.md)[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

The geometry family

## Use the geometry representation that matches the work.

Readable GeoJSON is useful for application logic; binary and columnar forms reduce conversion overhead for rendering and analytical pipelines.

01

GeoJSONTable

FeatureCollection with table metadata

02

Binary

Typed geometry arrays for rendering

03

WKB

Compact interoperable geometry bytes

04

Tessellation

Optional polygon preparation for drawing

Detailed guide

## Geometry reference

The sections below introduce the supported geometry table forms and tessellation considerations.

## GeoJSONTable[​](#geojsontable "Direct link to GeoJSONTable")

The `GeoJSONTable` is one of the standard data return formats from loaders.gl loaders. It is a GeoJSON FeatureCollection with two extra fields (`shape` and `schema`)

## Binary Geometries[​](#binary-geometries "Direct link to Binary Geometries")

loaders.gl defines a Binary Geometry Format.

The format is designed to work directly with the binary support in deck.gl layers.

See the [binary feature layout](https://loaders.gl/next/docs/modules/core/geoarrow/api-reference/convert-geojson-to-binary-feature-collection.md) for the retained rendering representation.

##

## Tesselation[​](#tesselation "Direct link to Tesselation")

Some loaders can perform tesselation.

This is typically done with earcut, which is a very fast polygon tesselator. The drawback with

There can also be problems if polygons have very large numbers of holes.
