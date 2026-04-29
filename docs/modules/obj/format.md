import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';

# OBJ Format

<ObjDocsTabs active="format" />

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/obj/api-reference/obj-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>OBJLoader</strong>
    <span>Loads OBJ meshes as Mesh objects or Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/obj/api-reference/obj-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>OBJWriter</strong>
    <span>Writes Mesh or Mesh Arrow table data as Wavefront OBJ text.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync, encodeTextSync</span>
  </a>
</div>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Wavefront OBJ](/docs/modules/obj/formats/obj)                                              |
| Data Format          | [Mesh](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extension       | `.obj`                                                                                     |
| MIME Type            | Not standardized                                                                           |
| File Type            | Text                                                                                       |
| Loader Decoder Type  | Synchronous                                                                                |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
| Writer File Type     | Text                                                                                       |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                   |

## Mesh Data

OBJ files describe mesh geometry through vertex positions, texture coordinates, normals, and face indices. `OBJLoader` returns legacy Mesh objects by default, or Mesh Arrow tables when `obj.shape: 'arrow-table'` is selected.

## Materials

OBJ files are commonly paired with MTL files for material definitions. loaders.gl's OBJ support focuses on geometry data.
