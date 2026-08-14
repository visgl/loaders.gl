# Mesh Arrow Tables

Mesh Arrow is the loaders.gl convention for representing a renderable mesh or point-cloud
primitive as an Apache Arrow table. loaders.gl 5.0 alpha produces and consumes this
representation, and luma.gl v10 master can turn the same table into GPU geometry.

Mesh Arrow is a vis.gl interoperability contract, not an Apache Arrow, GeoArrow, or glTF
standard. The current contract deliberately covers geometry attributes, primitive topology,
indices, and a small amount of metadata. Scene graphs, materials, textures, and draw scheduling
remain separate concerns.

## The 5.0 Data Model

A `MeshArrowTable` is a loaders.gl table wrapper around an `arrow.Table`:

```ts
import type {MeshArrowTable} from '@loaders.gl/schema';

declare const mesh: MeshArrowTable;

mesh.shape; // 'arrow-table'
mesh.topology; // 'point-list' | 'triangle-list' | 'triangle-strip'
mesh.data; // apache-arrow Table
```

The raw Arrow table uses **one vertex per row**. Each vertex attribute is a scalar numeric column
or a numeric `FixedSizeList` column. This layout is directly compatible with GPU vertex and
instance buffers and replaces the earlier proposal to store an entire mesh in each Arrow row.

### Columns

| Column | Arrow type | Requirement | Meaning |
| --- | --- | --- | --- |
| `POSITION` | `FixedSizeList<Float32, 3>` | Required | One XYZ position per row |
| `NORMAL` | Usually `FixedSizeList<Float32, 3>` | Optional | One normal per row |
| `COLOR_0` | Numeric `FixedSizeList<3 \| 4>` | Optional | First vertex color |
| `TEXCOORD_0` | Numeric `FixedSizeList<2>` | Optional | First texture coordinate |
| `TEXCOORD_1` | Numeric `FixedSizeList<2>` | Optional | Second texture coordinate |
| `indices` | `List<Int32>` | Indexed meshes only | The complete primitive index list is stored in row `0`; the remaining rows are null |
| Custom | Numeric scalar or `FixedSizeList<1 \| 2 \| 3 \| 4>` | Optional | Loader- or application-specific vertex attribute |

`POSITION`, `NORMAL`, `COLOR_0`, and `TEXCOORD_n` follow glTF attribute semantic names. The
lowercase `indices` name follows the glTF primitive property and is not a vertex attribute.

`@loaders.gl/schema` exports the corresponding TypeScript types and predefined schemas:

- `MeshArrowTable`, `MeshArrowColumns`, and `MeshArrowTableData`
- `IndexedMeshArrowColumns` and `IndexedMeshArrowTableData`
- `meshArrowSchema` and `indexedMeshArrowSchema`

The predefined indexed schema uses `List<Int32>`. A consumer may upload those non-negative values
as `Uint16` or `Uint32` indices when the GPU representation permits it.

### Metadata

Arrow schema and field metadata values are strings. Structured values are JSON-encoded.

| Location | Key | Meaning |
| --- | --- | --- |
| Schema | `topology` | `point-list`, `triangle-list`, or `triangle-strip` |
| Schema | `mode` | Numeric WebGL/glTF primitive mode retained for compatibility |
| Schema | `boundingBox` | JSON `[[minX, minY, minZ], [maxX, maxY, maxZ]]` when known |
| Field | `normalized` | Whether an integer attribute maps to a normalized GPU format |
| Field | `byteOffset` | Source accessor byte offset when retained |
| Field | `byteStride` | Source accessor byte stride when retained |

The wrapper's `topology` property is authoritative for a `MeshArrowTable`. The schema value lets a
raw `arrow.Table` retain the same information when it is passed without the loaders.gl wrapper.

### Record Batches

Record batches are chunks of one logical vertex table. They are not separate meshes and do not
change the meaning of a row. This lets parsers stream large point clouds and meshes without
turning each batch into a new data model.

An indexed table currently has one primitive-level index list. Applications that need several
primitives with different materials or pipelines should keep separate Mesh Arrow tables or add an
explicit scene/primitive layer above the tables.

## Producing Mesh Arrow Tables

### Load a mesh or point cloud

Mesh-category loaders expose Arrow output through a loader-specific `shape: 'arrow-table'`
option. For example:

```ts
import {load} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import type {MeshArrowTable} from '@loaders.gl/schema';

const pointCloud = await load('point-cloud.laz', LASLoader, {
  las: {shape: 'arrow-table'}
}) as MeshArrowTable;
```

Draco, LAS, OBJ, PCD, PLY, quantized-mesh, and terrain loaders can produce Mesh Arrow tables.
Gaussian splat loaders already return Mesh Arrow tables. See the
[Mesh and PointCloud category](/docs/specifications/category-mesh) for the current loader and
writer matrix.

### Convert or construct a table

`@loaders.gl/schema-utils` converts the legacy `Mesh` shape or builds a table directly from typed
attributes:

```ts
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';

const triangle = makeMeshArrowTable(
  {
    POSITION: {
      value: new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0
      ]),
      size: 3
    }
  },
  {
    topology: 'triangle-list',
    mode: 4,
    indices: {value: new Uint32Array([0, 1, 2]), size: 1}
  }
);
```

Use `convertMeshToTable(mesh, 'arrow-table')` when starting with a legacy loaders.gl `Mesh`, and
`convertTableToMesh(table)` only when an API still requires that legacy representation.

## Rendering with luma.gl v10

`@luma.gl/arrow` defines a structural `ArrowMeshTable` type that mirrors loaders.gl's
`MeshArrowTable` without adding a loaders.gl dependency. `ArrowTableGeometry` and
`makeGPUGeometryFromArrow()` accept the loaders.gl wrapper directly:

```ts
import {makeGPUGeometryFromArrow} from '@luma.gl/arrow';
import {Model} from '@luma.gl/engine';

const geometry = makeGPUGeometryFromArrow(device, {
  arrowMesh: triangle,
  interleaved: true
});

const model = new Model(device, {
  id: 'arrow-mesh',
  vs,
  fs,
  shaderLayout,
  geometry
});
```

The geometry adapter:

- maps `POSITION`, `NORMAL`, `COLOR_0`, `TEXCOORD_0`, and `TEXCOORD_1` to luma.gl attributes
  `positions`, `normals`, `colors`, `texCoords`, and `texCoords1`;
- accepts an `arrowPaths` mapping for custom column names;
- packs selected attributes into one interleaved vertex buffer by default;
- creates one buffer per attribute when `interleaved: false`;
- uploads the row-0 `indices` list as a separate index buffer; and
- uses the index count for indexed draws and the Arrow row count otherwise.

The direct geometry path creates static GPU geometry from numeric scalar and `FixedSizeList`
attributes with one to four components, subject to portable GPU vertex-format limits. It rejects
64-bit integers, Float64 attributes, non-numeric columns, and variable-length vertex attributes.
Nullable vertex rows are not supported. Fill or convert unsupported columns to a shader-ready
representation before creating the geometry.

For lower-level table pipelines, `@luma.gl/arrow` also provides:

- `makeGPUDataFromArrowData()` for one Arrow data chunk;
- `makeGPUVectorFromArrow()` for one Arrow vector;
- `makeGPURecordBatchFromArrowRecordBatch()` for one record batch; and
- `makeGPUTableFromArrowTable()` for a table whose record-batch boundaries should be preserved.

Those adapters produce the Arrow-independent `GPUData`, `GPUVector`, `GPURecordBatch`, and
`GPUTable` types in `@luma.gl/tables`. Fixed-width Mesh Arrow columns become formats such as
`float32x3` and `unorm8x4`. Preserved batches can be drawn independently with
`GPUTableModel.drawBatches()` or explicitly consolidated with `GPUTable.packBatches()` when the
table shape permits it.

## Meshes, Instances, and Draws

The current vis.gl APIs keep three concerns separate:

| Concern | Recommended representation |
| --- | --- |
| Vertex and index data for one renderable primitive | loaders.gl `MeshArrowTable`, then luma.gl `ArrowTableGeometry` |
| Per-object transforms, colors, feature ids, or visibility | A row-oriented Arrow table, then luma.gl `GPUTable`/`GPUVector` objects |
| Draw counts, offsets, materials, pipelines, and resource groups | Renderer-owned draw metadata and luma.gl render/indirect-command APIs |

This separation supports both common batching strategies:

- **Instancing:** keep one Mesh Arrow geometry and put one transform and set of properties in each
  row of a separate instance table.
- **Packed primitives:** pack compatible vertex/index ranges into shared GPU buffers and retain a
  draw record per primitive or material group. The Arrow source tables do not need to encode GPU
  command records as geometry columns.

### Indirect drawing

luma.gl v10 exposes WebGPU `RenderPass.drawIndirect()` and `drawIndexedIndirect()` plus the
experimental `DrawCommandBuffer`. An indexed indirect record contains `indexCount`,
`instanceCount`, `firstIndex`, `baseVertex`, and `firstInstance`; a compute pass can update its
counts without a CPU readback.

Indirect commands complement Mesh Arrow but are not part of its schema. A renderer still owns
pipeline, material, texture, bind-group, and geometry compatibility. WebGPU does not provide a
portable bindless multi-draw operation that can choose arbitrary resources, so luma.gl records a
stable indirect call for each command slot and groups compatible slots at renderer-defined
resource boundaries.

## Relationship to GeoArrow

GeoArrow represents geospatial feature semantics: points, lines, polygons, multi-geometries,
coordinate reference systems, and geometry extension metadata. Mesh Arrow represents already
renderable primitive attributes and topology.

They can coexist in one application, but neither is a subtype of the other:

- GeoArrow point coordinates may already be usable as row-aligned GPU positions.
- Lines, polygons, and higher-level geometries normally need expansion or tessellation before
  they become renderable vertices and indices.
- luma.gl v10 includes Arrow path and polygon adapters that can perform model-specific conversion
  while retaining source row identity.
- loaders.gl's GeoArrow utilities provide geospatial conversion and triangulation helpers; a
  resulting render mesh can be stored as a separate Mesh Arrow table.

Keeping the source GeoArrow table and the derived Mesh Arrow/GPU data separate avoids duplicating
feature properties for every generated vertex. An explicit row-index or feature-id vector can
join generated vertices back to source feature rows for styling and picking.

## Storage in Arrow IPC and Parquet

The raw `arrow.Table` can be serialized with Arrow IPC. Its fixed-width attribute columns also
map naturally to Parquet physical storage, and schema metadata can carry the Mesh Arrow keys.
This does not make Mesh Arrow a Parquet standard: readers still need to agree on the vis.gl column
and metadata conventions, and a file containing several primitives needs its own dataset-level
organization.

## Current Non-goals

The Mesh Arrow contract does not currently standardize:

- scene hierarchy or multiple primitives in one wrapper;
- materials, textures, samplers, or shader selection;
- mesh compression or quantization transforms;
- morph targets, skinning, or animation;
- feature metadata and picking-id semantics; or
- indirect draw and renderer resource-group records.

Use glTF for a portable scene/material interchange format. Use Mesh Arrow when the useful boundary
is a typed, columnar, render-oriented primitive that can flow between loaders.gl, Arrow tooling,
and luma.gl.

## Related Documentation

- [Mesh and PointCloud category](/docs/specifications/category-mesh)
- [Apache Arrow support in loaders.gl](/docs/developer-guide/apache-arrow)
- [GeoArrow format](/docs/modules/arrow/formats/geoarrow)
- [luma.gl Arrow overview](https://luma.gl/docs/api-reference/arrow)
- [luma.gl supported Arrow types](https://luma.gl/docs/api-reference/arrow/supported-arrow-types)
- [luma.gl DrawCommandBuffer](https://luma.gl/docs/api-reference/experimental/gpu-primitives/draw-command-buffer)
