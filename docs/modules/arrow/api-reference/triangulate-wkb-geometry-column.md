# triangulateWKBGeometryColumn

`triangulateWKBGeometryColumn` tessellates a GeoArrow WKB geometry column and returns two Apache
Arrow columns: triangle vertex indexes and the source XY vertices.

The helper accepts Polygon and MultiPolygon WKB values. Each output row matches the corresponding
input geometry row. Null input rows produce null output rows.

## Usage

```ts
import {triangulateWKBGeometryColumn} from '@loaders.gl/arrow';

const {vertexIndices, vertices} = triangulateWKBGeometryColumn(geometryColumn);
```

## API

```ts
triangulateWKBGeometryColumn(geometryColumn);
```

`geometryColumn` is an Apache Arrow JS `Vector<Binary>` containing GeoArrow WKB geometry values.

Returns an object with:

| Field           | Type                                      | Description                                      |
| --------------- | ----------------------------------------- | ------------------------------------------------ |
| `vertexIndices` | `Vector<List<Int32>>`                     | Triangle indexes into the matching `vertices` row |
| `vertices`      | `Vector<List<FixedSizeList[2]<Float64>>>` | XY source vertices, preserving WKB vertex order  |

## Worker API

`triangulateWKBColumnOnWorker` runs the same operation on the triangulation worker. It accepts a
structured-cloneable Arrow `Data` payload and returns serialized Arrow data for the two output
columns.
