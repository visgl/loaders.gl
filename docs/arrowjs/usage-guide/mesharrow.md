# Storing Meshes in Arrow Tables

![arrow-logo](../images/logos/apache-arrow-small.png)

"MeshArrow" is a set of conventions for storing binary GPU geometries
(point clouds and meshes) in Apache Arrow tables.

It is inspired by GeoArrow but is not a standard in any way, it is a set of conventions
for the vis.gl frameworks (loaders.gl, luma.gl, deck.gl etc). If similar standards do
emerge, we expect to adopt those.

## Row Modes

| Row Mode   | List |
| ---------- | ---- |
| `vertex`   |      |
| `geometry` |      |

## Column Conventions

- `FixedSizeList<3, Float*>`
- `List<FixedSizeList<3, Float*>>`

- Indexes `List<Uint32>` (with only first row defined)

## Metadata Conventions

Metadata Conventions include:

- Whether a column represents positions, normals, etc well known attributes
- Whether a column is quantized
- Whether a transform should be applied (e.g. UVs)

## Considerations

### Triangulation

Mesharrow is designed to hold triangulated geometries.

A particular example is GeoArrow polygons
(that can be very complex with an outer hull and multiple complex holes), an expensive
triangulation process needs to be performed that converts a more abstract geometry into a list
of triangles that a GPU can render.

### Expanding/duplicating rows to match geometry

For a table where each row has its own variable length geometry, the GPU either needs other columns to match the length, or it needs to use indirection through row ids.

### Row Ids

As each GPU shader can see only the current triangle and its vertices, it is useful to be able to know which row in the arrow table a specific vertex belongs to.

a simple process is to generate a

`List<FixedSizeList<Float>>` => `List<Uint32>`

This creates a columnar array where each vertex index references the current row index, and additional looups can be done.
