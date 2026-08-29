---
title: Tile Converter supported features
description: Check which I3S and 3D Tiles layer types, versions, sources, extensions, and output options the converter supports.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tile converter / compatibility"
  title="Check the conversion boundary before starting a large job."
  description="I3S and 3D Tiles are broad standards with several layer types, payloads, versions, and extensions. This matrix records the subset the tile-converter can currently translate and the cases that remain outside its contract."
  tone="violet"
  meta={['Layer types', 'Input sources', 'Version and extension matrix']}
  links={[
    {label: 'Tile Converter CLI', to: '/docs/modules/tile-converter/cli-reference/tile-converter'},
    {label: 'I3S converter API', to: '/docs/modules/tile-converter/api-reference/i3s-converter'},
    {label: '3D Tiles converter API', to: '/docs/modules/tile-converter/api-reference/3d-tiles-converter'}
  ]}
/>

<DocOrientation
  eyebrow="Compatibility at a glance"
  title="Know what will translate before bytes start moving."
  description="Use the tables below to distinguish supported inputs from partial or unsupported features. A standard version being recognized does not imply every embedded layer or extension is convertible."
  tone="violet"
  items={[
    {label: 'Layers', value: 'Compare I3S and 3D Tiles scene, mesh, point, and composite types.'},
    {label: 'Sources', value: 'Check local folders, services, SLPK containers, and hosted URLs.'},
    {label: 'Versions', value: 'Review supported standard generations and in-progress coverage.'},
    {label: 'Extensions', value: 'Inspect input preservation and output limitations explicitly.'}
  ]}
/>

<ReferenceBoundary
  title="Supported-feature matrix"
  description="The detailed tables below define layer, source, version, extension, and option support for the current converter line."
  tone="violet"
/>

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

| Specification | Data source type         | Status                          |
| ------------- | ------------------------ | ------------------------------- |
| `I3S`         | SLPK                     | Supported as local HTTP service |
| `I3S`         | HTTP REST service        | Supported                       |
| `3DTiles`     | Local file system folder | Supported                       |
| `3DTiles`     | Cesium ION URL           | Supported                       |

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
| `glTF`     | `EXT_mesh_features`          | Supported                |
| `glTF`     | `EXT_feature_metadata`       | Supported                |
| `glTF`     | `EXT_structural_metadata`    | Supported                |

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
