# Overview

The `@loaders.gl/las` module supports the [LASER file format](/docs/modules/las/formats/las) (LAS) and its compressed version (LAZ).

:::caution
The `@loaders.gl/las` module only supports LAS/lAZ files up to LAS v1.3. It does not support LAS v1.4 files.
For more detail, see the discussion in [Github Issues](https://github.com/visgl/loaders.gl/issues/591).
:::

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/las
```

## Loaders and Writers

| Loader or Writer                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`LASArrowLoader`](/docs/modules/las/api-reference/las-loader) | Loads LAS/LAZ point clouds as [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`LASLoader`](/docs/modules/las/api-reference/las-loader)      | Loads LAS/LAZ point clouds as Mesh objects.      |
| [`LASWriter`](/docs/modules/las/api-reference/las-writer)      | Writes Mesh or Mesh Arrow table point clouds as uncompressed LAS data. |

## Attribution

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.
