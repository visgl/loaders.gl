GeoJSON geometry

GeoJSON

# GeoJSON Geometry

GeoJSON geometry objects describe coordinates and their type without carrying feature properties. They are useful on their own when a pipeline needs geometry before it assembles complete features.

[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)[GeoJSON loader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[GIS category](https://loaders.gl/next/docs/specifications/category-gis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-gis.md)

The geometry boundary

## Choose the type. Supply coordinates. Let the feature layer add context.

Geometry is the spatial part of a GeoJSON feature. Keeping it separate is useful for geometry-only APIs, validation, conversion, and renderer-facing data paths.

01

Type

Point, LineString, Polygon, or Multi\* geometry

02

Coordinates

Nested arrays matching the geometry type

03

Context

Properties and IDs belong to the feature layer

04

Alternatives

WKB for compact binary, WKT for text geometry

GeoJSON geometries can sometimes be useful independently of GeoJSON.

Detailed guide

## Geometry structure details

The reference below covers coordinate nesting, geometry examples, and the tradeoffs against WKB, WKT, and GML geometry.

## Examples[​](#examples "Direct link to Examples")

```
  {

    "type": "Point",

    "coordinates": [102.0, 0.5]

  },
```

```
  {

    "type": "LineString",

    "coordinates": [

      [102.0, 0.0],

      [103.0, 1.0],

      [104.0, 0.0],

      [105.0, 1.0]

    ]

  },
```

```
{

  "type": "Polygon",

  "coordinates": [

    [

      [100.0, 0.0],

      [101.0, 0.0],

      [101.0, 1.0],

      [100.0, 1.0],

      [100.0, 0.0]

    ]

  ]

}
```

## Alternatives[​](#alternatives "Direct link to Alternatives")

| Format       | Notes                                                               |
| ------------ | ------------------------------------------------------------------- |
| WKB          | Binary, more compact                                                |
| WKT          | Text based, slightly more compact, a bit harder to parse (not JSON) |
| GML Geometry | XML based, even more verbose, more complex to parse                 |
