# Overview

The `@loaders.gl/las` module supports the [LASER file format](/docs/modules/las/formats/las) (LAS) and its compressed version (LAZ).

LAZ point formats 0-10 are supported by the opt-in `typescript` backend. Legacy Point10/GPS/RGB/Byte items require LASzip version 2, legacy WavePacket13 uses version 1, and modern items support versions 2-4; support in the `copc` and `laz-rs` backends depends on their bundled decoder versions. The default `laz-perf` backend remains limited to LAS 1.3 and point formats 0-3. See the [LAS/LAZ implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for backend and point-format details.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/las
```

## Loaders and Writers

| Loader or Writer                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`LASLoader`](/docs/modules/las/api-reference/las-loader)      | Loads LAS/LAZ point clouds as Mesh objects or [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`LASWriter`](/docs/modules/las/api-reference/las-writer)      | Writes Mesh or Mesh Arrow table point clouds as uncompressed LAS data. |

## Attribution

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.
