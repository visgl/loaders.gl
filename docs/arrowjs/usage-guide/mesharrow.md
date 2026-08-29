---
title: Mesh Arrow tables
description: Represent renderable mesh and point-cloud primitives as typed Apache Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS guide · loaders.gl convention"
  title="Keep mesh attributes columnar all the way to the GPU boundary."
  description="Mesh Arrow is the loaders.gl convention for representing one renderable mesh or point-cloud primitive as an Apache Arrow table. It gives format loaders and renderers a shared geometry contract without pretending to replace scene graphs or materials."
  tone="blue"
  meta={['Mesh and point clouds', 'Apache Arrow table', 'luma.gl interop']}
  links={[
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'},
    {label: 'Apache Arrow guide', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Mesh Arrow package', to: '/docs/modules/schema/table-guide'}
  ]}
/>

<DocOrientation
  eyebrow="The Mesh Arrow contract"
  title="One vertex per row. Typed attributes by semantic name."
  description="The table stores vertex attributes in Arrow columns, with topology and optional index metadata kept alongside the data. That makes it possible to move geometry between loaders, transforms, workers, and GPU adapters."
  tone="blue"
  items={[
    {label: 'Required column', value: 'POSITION as an XYZ fixed-size list'},
    {label: 'Optional columns', value: 'NORMAL, COLOR_0, TEXCOORD_n, and custom attributes'},
    {label: 'Topology', value: 'Point list, triangle list, or triangle strip'},
    {label: 'Scene boundary', value: 'Materials, textures, placements, and draw scheduling stay separate'}
  ]}
/>

<ReferenceBoundary
  title="Mesh Arrow storage and interop"
  description="The reference below defines columns, metadata, record batches, table construction, glTF projection, zero-copy limits, and luma.gl upload behavior."
  tone="blue"
/>

Mesh Arrow is the loaders.gl convention for representing one renderable mesh or point-cloud primitive as an Apache Arrow table. It is a vis.gl interoperability contract, not an Apache Arrow, GeoArrow, or glTF standard.

The contract deliberately covers geometry attributes, primitive topology, indices, and a small amount of metadata. Scene graphs, materials, textures, instances, and draw scheduling remain separate concerns.

## Data model

A `MeshArrowTable` wraps an `arrow.Table`:

```ts
import type {MeshArrowTable} from '@loaders.gl/schema';

declare const mesh: MeshArrowTable;

mesh.shape; // 'arrow-table'
mesh.topology; // 'point-list' | 'triangle-list' | 'triangle-strip'
mesh.data; // Apache Arrow Table
```

The raw Arrow table has **one vertex per row**. Each vertex attribute is a scalar numeric column or a numeric `FixedSizeList` column. This is directly compatible with GPU vertex and instance buffers.

| Column | Arrow type | Requirement | Meaning |
| --- | --- | --- | --- |
| `POSITION` | `FixedSizeList<Float32, 3>` | Required | One XYZ position per row |
| `NORMAL` | Numeric `FixedSizeList<3>` | Optional | One normal per row |
| `COLOR_0` | Numeric `FixedSizeList<3 or 4>` | Optional | First vertex color |
| `TEXCOORD_0`, `TEXCOORD_1` | Numeric `FixedSizeList<2>` | Optional | Texture coordinates |
| `indices` | `List<Int32>` | Indexed meshes only | Complete primitive index list at row `0`; remaining rows are null |
| Custom | Numeric scalar or `FixedSizeList<1-4>` | Optional | Loader- or application-specific vertex attribute |

`POSITION`, `NORMAL`, `COLOR_0`, and `TEXCOORD_n` use glTF attribute semantic names. The lowercase `indices` name follows the glTF primitive property; it is not a vertex attribute.

`@loaders.gl/schema` exports `MeshArrowTable`, `MeshArrowColumns`, `MeshArrowTableData`, `IndexedMeshArrowColumns`, `IndexedMeshArrowTableData`, `meshArrowSchema`, and `indexedMeshArrowSchema` for this contract.

### Metadata and record batches

Schema metadata retains `topology`, numeric primitive `mode`, and optionally `boundingBox`. Field metadata can retain the source `normalized`, `byteOffset`, and `byteStride` values. Metadata values are strings; structured values are JSON-encoded.

The `MeshArrowTable.topology` property is authoritative. Schema metadata lets the same information survive when a raw Arrow table is passed without the loaders.gl wrapper.

Record batches are chunks of one logical vertex table, not separate meshes. An indexed table has one primitive-level index list. Keep primitives with different materials or pipelines in separate Mesh Arrow tables, or place them in an explicit scene/primitive layer above the tables.

## Producing tables

Mesh-category loaders expose Arrow output through a loader-specific `shape: 'arrow-table'` option:

```ts
import {load} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import type {MeshArrowTable} from '@loaders.gl/schema';

const pointCloud = (await load('point-cloud.laz', LASLoader, {
  las: {shape: 'arrow-table'}
})) as MeshArrowTable;
```

`@loaders.gl/schema-utils` can build a table from typed attributes:

```ts
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';

const triangle = makeMeshArrowTable(
  {
    POSITION: {
      value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
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

Use `convertMeshToTable(mesh, 'arrow-table')` when starting from a legacy loaders.gl `Mesh`. See the [Mesh and PointCloud category](/docs/specifications/category-mesh) for the loader and writer matrix.

### Project a glTF scene

`@loaders.gl/gltf/mesh-arrow` converts an already loaded glTF scene into reusable Mesh Arrow geometries and separate scene placements. Each source primitive is converted once even when its mesh is referenced by multiple nodes.

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {convertGLTFToMeshArrow} from '@loaders.gl/gltf/mesh-arrow';

const gltf = await load('scene.glb', GLTFLoader);
const meshArrow = convertGLTFToMeshArrow(gltf);

for (const geometry of meshArrow.geometries) {
  geometry.table; // MeshArrowTable, including optional row-0 indices
  geometry.materialIndex; // optional source material reference
  geometry.materialized; // true if packed storage had to be allocated
}

for (const placement of meshArrow.placements) {
  meshArrow.geometries[placement.geometryIndex];
  placement.worldMatrix;
}
```

Dense, packed accessors retain views of their source buffers. Interleaved, sparse, and implicit-zero accessors are materialized into packed arrays containing the same component values. Use `{accessorLayout: 'zero-copy-only'}` to reject accessors that require allocation. Conversion does not modify the source glTF, bake node transforms, evaluate skinning or morph targets, resolve GPU instancing, or decide how to batch draws.

## Rendering with luma.gl

`@luma.gl/arrow` accepts the loaders.gl wrapper structurally, without introducing a loaders.gl dependency. `makeGPUGeometryFromArrow()` can create static GPU geometry from a Mesh Arrow table:

```ts
import {makeGPUGeometryFromArrow} from '@luma.gl/arrow';

const geometry = makeGPUGeometryFromArrow(device, {
  arrowMesh: triangle,
  interleaved: true
});
```

The adapter maps common Mesh Arrow columns to luma.gl geometry attributes, can pack attributes into an interleaved vertex buffer, and uploads the row-0 `indices` list as a separate index buffer. Its direct geometry path is for numeric scalar and fixed-size-list attributes with portable GPU vertex formats; applications should convert unsupported nullable, variable-length, 64-bit integer, or Float64 attributes before upload.

## Meshes, instances, and draws

Keep these responsibilities separate:

| Concern | Recommended representation |
| --- | --- |
| Vertex and index data for one renderable primitive | `MeshArrowTable`, then luma.gl Arrow geometry |
| Per-object transforms, colors, feature ids, or visibility | A separate row-oriented Arrow table |
| Draw counts, offsets, materials, pipelines, and resource groups | Renderer-owned draw metadata and render APIs |

This supports two common batching strategies:

- **Instancing:** retain one Mesh Arrow geometry and keep one transform and property set per row of a separate instance table.
- **Packed primitives:** pack compatible vertex/index ranges into shared GPU buffers and retain a renderer draw record per primitive or material group.

Indirect draw commands complement Mesh Arrow but are not part of its schema. A renderer still owns pipeline, material, texture, bind-group, and geometry compatibility.

## Relationship to GeoArrow and storage

GeoArrow represents geospatial feature semantics such as points, lines, polygons, coordinate reference systems, and geometry metadata. Mesh Arrow represents already renderable vertex attributes and topology. A GeoArrow feature table may need tessellation or expansion before it becomes a Mesh Arrow table. Keep source feature tables and derived render meshes separate, joining them with an explicit row index or feature id when needed.

The raw Arrow table can be serialized with Arrow IPC and maps naturally to Parquet's fixed-width columns. That does not make Mesh Arrow a file-format standard: readers still need to agree on the vis.gl column and metadata conventions, and a collection of primitives needs a dataset-level organization.

## Current non-goals

Mesh Arrow does not standardize scene hierarchy, materials, textures, samplers, shader selection, compression or quantization transforms, morph targets, skinning, animation, feature metadata, picking ids, or indirect-draw/resource-group records.

Use glTF for portable scene and material interchange. Use Mesh Arrow when the useful boundary is a typed, columnar, render-oriented primitive that can flow between loaders.gl, Arrow tooling, and luma.gl.

## Related documentation

- [Mesh and PointCloud category](/docs/specifications/category-mesh)
- [Apache Arrow support in loaders.gl](/docs/developer-guide/apache-arrow)
- [GeoArrow format](/docs/modules/arrow/formats/geoarrow)
- [luma.gl Arrow overview](https://luma.gl/docs/api-reference/arrow)
