# Overview

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
current LAS/LAZ projection-record support and vertical/compound CRS roadmap.

The `@loaders.gl/las` module supports the [LASER file format](/docs/modules/las/formats/las) (LAS) and its compressed version (LAZ).

`LASLoader` supports LAZ point formats 0-10 for documented LASzip codec combinations. Arrow output exposes positions, intensity, classification, RGB, GPS time, and NIR where present, while the raw APIs preserve complete supported point records. See the [LAS/LAZ implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for exact codec, point-format, fixture, and streaming details.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/las
```

## Loaders and Writers

| Loader or Writer                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`LASLoader`](/docs/modules/las/api-reference/las-loader)      | Loads LAS/LAZ point clouds as Mesh objects or [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`LASWriter`](/docs/modules/las/api-reference/las-writer)      | Writes Mesh or Mesh Arrow table point clouds as LAS or LAZ data. |

## Attribution

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.
