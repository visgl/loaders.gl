GeoArrow API · render conversion

# Turn feature objects into typed geometry arrays.

convertGeojsonToBinaryFeatureCollection removes repeated object traversal and serialization from a visualization path. It groups points, lines, and polygons into typed arrays while preserving the ids and properties an application needs.

[GeoArrow module](https://loaders.gl/next/docs/modules/core/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/geoarrow.md)[Render converters](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md)[GIS category](https://loaders.gl/next/docs/specifications/category-gis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-gis.md)

The conversion result

## Keep the feature meaning. Change the memory layout.

The output is organized by geometry family. Positions and indexes become typed arrays, while properties and feature ids remain available for picking, styling, and application logic.

01

Input

A GeoJSON feature array

02

Geometry bins

Separate points, lines, and polygons outputs

03

Typed data

Positions, offsets, ids, and numeric properties

04

Use it when

A renderer or worker benefits from binary transfer

Detailed guide

## convertGeojsonToBinaryFeatureCollection output contract

The reference below documents output fields, options, geometry-family mappings, triangulation, and property handling.

Helper function to transform an array of GeoJSON `Feature`s into binary typed arrays. This is designed to speed up geospatial loaders by removing the need for serialization and deserialization of data transferred by the worker back to the main process.

## Usage[​](#usage "Direct link to Usage")

```
import type {Feature} from '@loaders.gl/core/schema';

import {convertGeojsonToBinaryFeatureCollection} from '@loaders.gl/core/geoarrow';



const features: Feature[] = [{

  type: 'Feature',

  geometry: {type: 'Point', coordinates: [1, 2]},

  properties: {name: 'Example'}

}];



// See table below for full list of options

const options = {PositionDataType: Float32Array};

const binaryFeatures = convertGeojsonToBinaryFeatureCollection(features, options);
```

## Outputs[​](#outputs "Direct link to Outputs")

`convertGeojsonToBinaryFeatureCollection` returns an object containing typed arrays sorted by geometry type. `positions` is a flat array of coordinates; `globalFeatureIds` references indices in the original `features` array; `featureIds` references feature indices of the same geometry type; `numericProps` contains `TypedArray`s generated from numeric feature properties; `properties` is an array of non-numeric property objects of the given geometry type.

Each `TypedArray` is wrapped inside an *accessor object*, where `.value` contains the raw numeric data, and `.size` gives the number of values per vertex. For example,

```
positions: {value: Float32Array, size: 3}
```

corresponds to 3D coordinates, where each vertex is defined by three numbers.

```
{

  points: {

    // Array of x, y or x, y, z positions

    positions: {value: PositionDataType, size: 3},

    // Array of original feature indexes by vertex

    globalFeatureIds: {value: Uint16Array | Uint32Array, size: 1},

    // Array of Point feature indexes by vertex

    featureIds: {value: Uint16Array | Uint32Array, size: 1},

    // Object with accessor objects for numeric properties

    // Numeric properties are sized to have one value per vertex

    numericProps: {

        numericProperty1: {value: Float32Array | Float64Array, size: 1}

    }

    // Array of objects with non-numeric properties from Point geometries

    properties: [{PointFeatureProperties}],

    // Non-standard top-level fields

    fields?: [{

      // Feature ids of source data (if present)

      id?: string | number

    }]

  },

  lines: {

    // Array of x, y or x, y, z positions

    positions: {value: PositionDataType, size: 3},

    // Indices within positions of the start of each individual LineString

    pathIndices: {value: Uint16Array | Uint32Array, size: 1},

    // Array of original feature indexes by vertex

    globalFeatureIds: {value: Uint16Array | Uint32Array, size: 1},

    // Array of LineString feature indexes by vertex

    featureIds: {value: Uint16Array | Uint32Array, size: 1},

    // Object with accessor objects for numeric properties

    // Numeric properties are sized to have one value per vertex

    numericProps: {

        numericProperty1: {value: Float32Array | Float64Array, size: 1}

    }

    // Array of objects with non-numeric properties from LineString geometries

    properties: [{LineStringFeatureProperties}],

    // Non-standard top-level fields

    fields?: [{

      // Feature ids of source data (if present)

      id?: string | number

    }]

  },

  polygons: {

    // Array of x, y or x, y, z positions

    positions: {value: PositionDataType, size: 3},

    // Indices within positions of the start of each complex Polygon

    polygonIndices: {value: Uint16Array | Uint32Array, size: 1},

    // Indices within positions of the start of each primitive Polygon/ring

    primitivePolygonIndices: {value: Uint16Array | Uint32Array, size: 1},

    // Triangle indices. Allows deck.gl to skip performing costly triangulation on main thread. Not present if `options.triangulate` is `false`

    triangles?: {value: Uint32Array, size: 1},

    // Array of original feature indexes by vertex

    globalFeatureIds: {value: Uint16Array | Uint32Array, size: 1},

    // Array of Polygon feature indexes by vertex

    featureIds: {value: Uint16Array | Uint32Array, size: 1},

    // Object with accessor objects for numeric properties

    // Numeric properties are sized to have one value per vertex

    numericProps: {

        numericProperty1: {value: Float32Array | Float64Array, size: 1}

    }

    // Array of objects with non-numeric properties from Polygon geometries

    properties: [{PolygonFeatureProperties}],

    // Non-standard top-level fields

    fields?: [{

      // Feature ids of source data (if present)

      id?: string | number

    }]

  }

}
```

## Options[​](#options "Direct link to Options")

| Option           | Type      | Default           | Description                                                                                                                                             |
| ---------------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fixRingWinding   | `Boolean` | `true`            | Whether to fix incorrect ring winding for polygons. Valid `GeoJSON` polygons have the outer ring coordinates in CCW order and with holes in CW order    |
| numericPropKeys  | `Array`   | Derived from data | Names of feature properties that should be converted to numeric `TypedArray`s. Passing `[]` will force all properties to be returned as normal objects. |
| PositionDataType | `class`   | `Float32Array`    | Data type used for positions arrays.                                                                                                                    |
| triangulate      | `Boolean` | `true`            | Whether polygons are broken into triangles as part of the conversion (generally required for GPU rendering)                                             |

## Notes[​](#notes "Direct link to Notes")

In the case of the source geoJson features having an object as a property, it would not be deep cloned, so it would be linked from the output object (be careful on further mutations).

Triangulation of polygons can be time consuming. If not needed, set the `triangulate` option to `false`.
