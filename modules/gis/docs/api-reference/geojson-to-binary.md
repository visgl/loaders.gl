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
*   PositionDataType: Float32Array
* }
*/
const binaryArrays = geojsonToBinary(geoJSONfeatures, options);
```

## Outputs

### TypedArrays

`geojsonToBinary` returns an object containing typed arrays sorted by geometry
type. `positions` corresponds to 2D or 3D coordinates; `objectIds` returns the
index of the vertex in the initial `features` array.

```js
{
  points: {
    // Array of x, y or x, y, z positions
    positions: Float32Array,
    // Array of original feature indexes by vertex
    objectIds: Uint32Array,
  },
  lines: {
    // Indices within positions of the start of each individual LineString
    pathIndices: Uint32Array,
    // Array of x, y or x, y, z positions
    positions: Float32Array,
    // Array of original feature indexes by vertex
    objectIds: Uint32Array,
  },
  polygons: {
    // Indices within positions of the start of each complex Polygon
    polygonIndices: Uint32Array,
    // Indices within positions of the start of each primitive Polygon/ring
    primitivePolygonIndices: Uint32Array,
    // Array of x, y or x, y, z positions
    positions: Float32Array,
    // Array of original feature indexes by vertex
    objectIds: Uint32Array,
  }
}
```

## Options

| Option           | Type                             | Default        | Description                         |
| ---------------- | -------------------------------- | -------------- | ----------------------------------- |
| PositionDataType | `Float32Array` or `Float64Array` | `Float32Array` | Data type used for positions arrays |
