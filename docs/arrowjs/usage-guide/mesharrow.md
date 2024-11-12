# MeshArrow: Storing Meshes in Arrow Tables

![arrow-logo](../images/logos/apache-arrow-small.png)

This page describes "MeshArrow", a set of conventions for storing binary GPU geometries
(point clouds and meshes) in Apache Arrow tables.

## Design Goals

To be able to store 3D meshes in arrow tables in a well-defined way.

A key realization is that each row can have all its vertices in a `POSITIONS` column in a `List<FixedSizeList<3, double>>`.

## Relationship to GeoArrow

- _MeshArrow_ focuses on storing GPU renderable 3D geometries (meshes), while GeoArrow focuses on storing simple 2D geospatial features (points, lines and polygons).
- _MeshArrow_ was inspired by GeoArrow, in terms of being a set of column type and metadata conventions for Apache Arrow, but is independent and can be used either separately or together with GeoArrow.
- _Mesharrow_ allows GPU renderable geometries to be generated from GeoArrow columns and stored in Apache Arrow table format, even appended as an additional "MeshArrow" column to the source GeoArrow table.

GeoArrow allows for simple 2D geometries to be stored in binary columnar form in Apache Arrow (and Parquet) tables. However, the stored geometries are not GPU renderable (in particular, for polygon fills), and GeoArrow objects must often be transformed (e.g. through triangulation) into a form that can be rendered by GPUs, and the resulting format is often no longer stored in Arrow.

## Relationship to GeoParquet ("MeshParquet"?)

- All the conventions defined by "MeshArrow" can also be applied to Parquet tables, so storing _MeshArrow_ formatted data (binary columns and metadata fields) in Parquet files is fully supported.
- In contrast to GeoParquet/GeoArrow, MeshArrow is not a standard. Mesharrow is being defined as a set of conventions for the vis.gl frameworks (loaders.gl, luma.gl, deck.gl etc). If defacto standards similar to "MeshArrow" were to emerge, expect vis.gl to adopt and favor those over MeshArrow.

## Design Goals

A key realization is that due to the sophisticated structure of the binary columnar type system in Apache Arrow, a mesh can be stored in a single Arrow Table row can have all its vertices in a `POSITIONS` column in a `List<FixedSizeList<3, double>>`.

#### One mesh

A mesh typically is separated into of a number of primitives with different "materials"

- "One-mesh-primitive-per-row" approach.
- "One-mesh-per-row" approach.
- One-mesh-per-record-batch?
  - Record Batches - The Apache Arrow record batch structure can certainly be used to wrap each mesh in its own record batch. An advantage is that each RecordBatch has its own `Data` object so there is no need to concatenate all the array buffers from the different meshes being combined into a table.

### Meshes that do not fit well into MeshArrow

- Heavily indexed meshes, where mesh primitives share vertices via indices.

### Feature Ids

Tracking feature ids in geometries is very important. For instance, "picking" use cases allow users to interact with rendered meshes and it is important to be able to determine the logical feature id that a specific rendered pixel on the screen represents.

| Id type       | Description                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| row index     | primary feature id for a one-mesh-per-row-table is naturally the row index.                                         |
| "global" id   | An additional column can be added to the table to contain an "arbitrary" global feature id for the row.             |
| Vertex based  | An additional `List<Uint32>` can contain a per vertex feature id. Not that shader interpolation should be disabled. |
| Texture based | If the geometry has `uvs` a `featureTexture` can be added, see e.g. `EXT_mesh_features`.                            |

The [`EXT_mesh_features`](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features) glTF extension gives some details around advanced feature id specification.

#### Materials

Full Handling of materials is outside the scope of this MeshArrow proposal. A material involved a bunch of settings that can be JSON encoded, however it also involves a number of a textures that typically need to be parsed into a browser specific object.

Binary data required to create images can be stored in a separate Apache Arrow table. However, textures typically need to be parsed into browser specific objects.

---

## Vertex Attributes

A binary geometry suitable for GPU rendering typically has a number of "attributes", which are just binary columns, suitable as columns in an Apache Arrow table.

- `positions`
- `normals`
- `uvs`
- `colors`
- ...

### Vertex Positions

This MeshArrow proposal currently only supports interleaved 3 component, 32 bit floating point vertexes.

```ts
type ArrowVertexPosition = arrow.FixedSizeList<3, arrow.Float>;
```

### Vertex UVs

This MeshArrow proposal currently only supports interleaved 2 component, 32 bit floating point vertexes.

```ts
type ArrowVertexUV = arrow.FixedSizeList<2, arrow.Float>;
```

## Topologies

A topology describes how vertexes are interpreted (how primitives are formed) during rendering.
Topology is stored in mesharrow metadata for a column.
WebGPU topologies are allowed (since like most WebGPU features they represent a widely supported subset of topologies).
In addition it is generally recommended to use simple topologies (`triangle-list`, `line-list`, `point-list`)

## Column Conventions

### Row Modes

Mesharrow identifies several modes in which geometries can be stored in tables

- One position vertex per Arrow Table row.
- One mesh (list of position vertexes) per Arrow Table row.

| Row Mode    | POSITIONS column type                  | Topology                                |
| ----------- | -------------------------------------- | --------------------------------------- |
| `vertex`    | `FixedSizeList<3, Float*>`             | One vertex per table row                |
| `primitive` | `List<FixedSizeList<3, Float*>>`       | One primitive per arrow table row       |
| `mesh`      | `List<List<FixedSizeList<3, Float*>>>` | Multiple primitives per arrow table row |

### Indexes

An index column can be defined, it will be a list of indexes into the POSITIONS column

- Indexes `List<Uint32>`

Note: Indexes are not always well supported.

## Mesharrow Metadata Conventions

Table / Schema Metadata Conventions include:

```json
{
  "geometryColumns": ["..."],
  "attributeColumns": ["..."],
  "rowMode": "vertex/primitive/mesh"
}
```

Field Metadata

- Whether a column represents positions, normals, etc well known attributes

```json
{
  "semantic?": "POSITION"
}
```

- Whether a column is quantized

```json
{
  "quantization?": {
    "scale": 1,
    "offset": 0
  }
}
```

- Whether a transform should be applied (e.g. UVs)

## Considerations

### Expanding/duplicating rows to match geometry

For a table where each row has its own variable length geometry, the GPU either needs other columns to match the length, or it needs to use indirection through row ids.

### Row Ids

As each GPU shader can see only the current triangle and its vertices, it is useful to be able to know which row in the arrow table a specific vertex belongs to.

a simple process is to generate a

`List<FixedSizeList<Float>>` => `List<Uint32>`

This creates a columnar array where each vertex index references the current row index, and additional looups can be done.

## Draw

### Instanced Draws

Instanced draws are very useful in data visualization since many visualizations
draw a copy of the same geometry (a circle, hexagon, line etc) for each row in the input table.
For instanced draws, the geometry is often separated from the data table.

### MultiDraw Support

GPU APIs often support MultiDraw operations (typically as an optional extension)
https://developer.chrome.com/blog/new-in-webgpu-131#experimental_support_for_multi-draw_indirect

As for multidraw, my understanding is that it is an optimized way to draw all the mesh primitives that share materials etc in a single lower overhead call.

If we store one mesh per row, we could just filter out all the Arrow Table rows that were using the same material, and get the start and end indices from the underlying arrow.Data offsets, and populate the multidraw parameter buffer.

---

## Library Functionality

A mesharrow library can provide a number of transformations to make

### getRowIndexAttributeColumn

Create a column

```ts
getRowIndexAttributeColumn(table: arrow.Table, columnName: string) => arrow.Vector<List<Uint32>>
```

### getVertexAttribute

Map a normal column to a vertex attribute by duplicating

```ts
getVertexAttribute(table: arrow.Table, columnName: string) => arrow.Vector<List<...>>
```

## "GeoArrow" functions

### Triangulation

Mesharrow is designed to hold triangulated geometries. Sometimes these geometries need to be generated (triangulated) from other, more complex geometries.

An important example is GeoArrow polygons (these can be very complex with an outer hull and multiple complex holes).
A computationally expensive triangulation process needs to be performed that converts the "abstract" polygon hull geometry into a simple list
of triangles that a GPU can render.

It is useful to offer support for GeoArrow to MeshArrow triangulation, preserving the full GeoArrow table.

```ts
triangulateGeoArrowToMeshArrow(table: arrow.Table, colum) => arrow.Table
```
