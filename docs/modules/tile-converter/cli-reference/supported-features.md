# Supported features

The tile-converter is capable to convert 3D tiles data of formats [3DTiles](https://github.com/CesiumGS/3d-tiles/tree/main/specification) and [I3S](https://github.com/Esri/i3s-spec). Both `3DTiles` and `I3S` are wide specifications which include many internal formats and data types. The tile-converter doesn't cover all features described in those specifications. This sheet summarises the compatibility of the tile-converter with different parts and features of `3DTiles` and `I3S`.

## Layer types

| Specification | Layer type           | Status                                                                                             |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `I3S`         | 3D objects           | Supported                                                                                          |
| `I3S`         | Integrated mesh      | Supported                                                                                          |
| `I3S`         | Point                | Not supported                                                                                      |
| `I3S`         | Point cloud          | Not supported                                                                                      |
| `I3S`         | Building scene layer | It is possible to convert a single sublayer (if it is of 3D objects of Integrated mesh layer type) |
| `3DTiles`     | Batched 3D Model     | Supported                                                                                          |
| `3DTiles`     | Instanced 3D Model   | Not supported                                                                                      |
| `3DTiles`     | Point Cloud          | Not supported                                                                                      |
| `3DTiles`     | Composite            | Not supported                                                                                      |

## Input data source types

| Specification | Data source type         | Status        |
| ------------- | ------------------------ | ------------- |
| `I3S`         | SLPK                     | Not supported |
| `I3S`         | HTTP REST service        | Supported     |
| `3DTiles`     | Local file system folder | Supported     |
| `3DTiles`     | Cesium ION URL           | Supported     |

## Versions

| Specification | Version  | Status                                                                |
| ------------- | -------- | --------------------------------------------------------------------- |
| `I3S`         | 1.6, 1.7 | Supported only as input data                                          |
| `I3S`         | 1.8      | Supported                                                             |
| `3DTiles`     | 1.0      | Supported                                                             |
| `3DTiles`     | vNext    | Partial support (see [3DTiles vNext support](#3dtiles-vnext-support)) |
| `3DTiles`     | 1.1      | In progress                                                           |

## 3DTiles vNext support

Some 3DTiles vNext extensions are supported as input data.

| Belongs to | Extension                    | Status                   |
| ---------- | ---------------------------- | ------------------------ |
| `3DTiles`  | `3DTILES_content_gltf`       | Supported                |
| `3DTiles`  | `3DTILES_multiple_contents`  | Not supported            |
| `3DTiles`  | `3DTILES_implicit_tiling`    | Supported                |
| `3DTiles`  | `3DTILES_bounding_volume_S2` | Supported                |
| `3DTIles`  | `3DTILES_metadata`           | Not applicable for `I3S` |
| `glTF`     | `EXT_mesh_features`          | In progress              |
| `glTF`     | `EXT_feature_metadata`       | In progress              |
| `glTF`     | `EXT_structural_metadata`    | In progress              |

## Internal data types

| Specification      | Data type                    | Description                   | Status             |
| ------------------ | ---------------------------- | ----------------------------- | ------------------ |
| `I3S`              | `Draco`                      | Compressed geometry           | Supported          |
| `3DTiles` (`glTF`) | `KHR_draco_mesh_compression` | Draco Compressed geometry     | Supported as input |
| `3DTiles` (`glTF`) | `EXT_meshopt_compression`    | Optimized geometry            | Supported as input |
| `3DTiles` (`glTF`) | `KHR_texture_transform`      | UV coordinates transformation | Supported as input |
| `I3S`, `3DTiles`   | `PNG`, `JPEG`                | Texture formats               | Supported          |
| `I3S`              | `KTX2` with `Basis` texture  | Compressed texture format     | Supported          |
| `I3S`              | `DDS`                        | Compressed texture format     | Supported as input |
| `3DTIles`          | `KTX2` with `Basis` texture  | Compressed texture format     | Supported as input |

## Mesh topology types

`I3S` specification supports only `TRIANGLE` mesh topology type.

| Specification | Mesh type        | Status                  |
| ------------- | ---------------- | ----------------------- |
| `3DTiles`     | `POINTS`         | Not applicable in `I3S` |
| `3DTiles`     | `LINES`          | Not applicable in `I3S` |
| `3DTiles`     | `LINE_LOOP`      | Not applicable in `I3S` |
| `3DTiles`     | `LINE_STRIP`     | Not applicable in `I3S` |
| `3DTiles`     | `TRIANGLES`      | Supported               |
| `3DTiles`     | `TRIANGLE_STRIP` | Supported as input      |
| `3DTiles`     | `TRIANGLE_FAN`   | Not supported           |
