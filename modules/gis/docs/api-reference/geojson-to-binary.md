# GeoJSON to TypedArrays

Helper function to transform an array of GeoJSON `Feature`s into binary typed
arrays. This is designed to speed up geospatial loaders by removing the need for
serialization and deserialization of data transferred by the worker back to the
main process.

## Usage

```js
import {load} from '@loaders.gl/core';
import {MVTLoader} from '@loaders.gl/mvt';
import {geojsonToBinary} from '@loaders.gl/gis';

// See MVTLoader docs for loader options
const geoJSONfeatures = await load(url, MVTLoader, loaderOptions);

/*
 * Default options are:
 *
 * {
 *   coordLength: derived from data
 *   numericPropKeys: derived from data
 *   PositionDataType: Float32Array
 * }
 */
const options = {PositionDataType: Float32Array};
const binaryArrays = geojsonToBinary(geoJSONfeatures, options);
```

## Outputs

`geojsonToBinary` returns an object containing typed arrays sorted by geometry
type. `positions` is a flat array of coordinates; `globalFeatureIds` references
indices in the original `features` array; `featureIds` references feature
indices of the same geometry type; `numericProps` contains `TypedArray`s
generated from numeric feature properties; `properties` is an array of
non-numeric property objects of the given geometry type.

Each `TypedArray` is wrapped inside an _accessor object_, where `.value` contains the raw numeric data, and `.size` gives the number of values per vertex. For example,

```js
positions: {value: Float32Array, size: 3}
```

corresponds to 3D coordinates, where each vertex is defined by three numbers.

```js
{
  points: {
    // Array of x, y or x, y, z positions
    positions: {value: PositionDataType, size: coordLength},
    // Array of original feature indexes by vertex
    globalFeatureIds: {value: Uint16Array || Uint32Array, size: 1},
    // Array of Point feature indexes by vertex
    featureIds: {value: Uint16Array || Uint32Array, size: 1},
    // Object with accessor objects for numeric properties
    // Numeric properties are sized to have one value per vertex
    numericProps: {
        numericProperty1: {value: Float32Array, size: 1}
    }
    // Array of objects with non-numeric properties from Point geometries
    properties: [{PointFeatureProperties}]
  },
  lines: {
    // Array of x, y or x, y, z positions
    positions: {value: PositionDataType, size: coordLength},
    // Indices within positions of the start of each individual LineString
    pathIndices: {value: Uint16Array || Uint32Array, size: 1},
    // Array of original feature indexes by vertex
    globalFeatureIds: {value: Uint16Array || Uint32Array, size: 1},
    // Array of LineString feature indexes by vertex
    featureIds: {value: Uint16Array || Uint32Array, size: 1},
    // Object with accessor objects for numeric properties
    // Numeric properties are sized to have one value per vertex
    numericProps: {
        numericProperty1: {value: Float32Array, size: 1}
    }
    // Array of objects with non-numeric properties from LineString geometries
    properties: [{LineStringFeatureProperties}]
  },
  polygons: {
    // Array of x, y or x, y, z positions
    positions: {value: PositionDataType, size: coordLength},
    // Indices within positions of the start of each complex Polygon
    polygonIndices: {value: Uint16Array || Uint32Array, size: 1},
    // Indices within positions of the start of each primitive Polygon/ring
    primitivePolygonIndices: {value: Uint16Array || Uint32Array, size: 1},
    // (Optional) triangle indices. Returned by MVTLoader when `binary` option is used. Allows deck.gl to skip performing costly triangulation on main thread (https://github.com/visgl/loaders.gl/pull/1356)
    triangles: {value: Uint32Array, size: 1},
    // Array of original feature indexes by vertex
    globalFeatureIds: {value: Uint16Array || Uint32Array, size: 1},
    // Array of Polygon feature indexes by vertex
    featureIds: {value: Uint16Array || Uint32Array, size: 1},
    // Object with accessor objects for numeric properties
    // Numeric properties are sized to have one value per vertex
    numericProps: {
        numericProperty1: {value: Float32Array, size: 1}
    }
    // Array of objects with non-numeric properties from Polygon geometries
    properties: [{PolygonFeatureProperties}]
  }
}
```

## Options

| Option           | Type     | Default           | Description                                                                                                                                             |
| ---------------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PositionDataType | `class`  | `Float32Array`    | Data type used for positions arrays.                                                                                                                    |
| numericPropKeys  | `Array`  | Derived from data | Names of feature properties that should be converted to numeric `TypedArray`s. Passing `[]` will force all properties to be returned as normal objects. |
| coordLength      | `number` | Derived from data | Number of dimensions per coordinate.                                                                                                                    |

## Notes

In the case of the source geoJson features having an object as a property, it would not be deep cloned, so it would be linked from the output object (be careful on further mutations).
