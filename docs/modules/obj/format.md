---
title: OBJ format
description: Exchange readable Wavefront mesh geometry through common mesh and Mesh Arrow data shapes.
hide_title: true
page_style: designed
---

import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Mesh interchange format"
  title="Readable mesh geometry with a long tail of tooling."
  description="Wavefront OBJ is a simple text format for vertices, normals, texture coordinates, and faces. loaders.gl maps it into the shared mesh pipeline and can write compatible OBJ text back out."
  tone="violet"
  meta={['Wavefront OBJ', 'Readable text', 'Mesh and Arrow output']}
  links={[
    {label: 'OBJ module', to: '/docs/modules/obj'},
    {label: 'OBJLoader', to: '/docs/modules/obj/api-reference/obj-loader'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<ObjDocsTabs active="format" />

<DocOrientation
  eyebrow="The OBJ data path"
  title="Parse familiar text into a portable mesh shape."
  description="OBJ keeps the source easy to inspect and edit, while the loader resolves its separate attribute streams and face references into data that renderers and Arrow-based tools can consume."
  tone="violet"
  items={[
    {label: 'Geometry', value: 'Vertices, normals, UVs, colors, and faces'},
    {label: 'Materials', value: 'Optional MTL references are recognized at the loader boundary'},
    {label: 'Output', value: 'Mesh objects or Mesh Arrow tables'},
    {label: 'Write', value: 'Encode compatible mesh data as OBJ text'}
  ]}
/>

<ReferenceBoundary
  title="OBJ structure and APIs"
  description="The reference below covers the file layout, loaders, writers, mesh output, materials, and implementation limits."
  tone="violet"
/>

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
