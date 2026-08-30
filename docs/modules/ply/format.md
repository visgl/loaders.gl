---
title: PLY format
description: Read and write polygon meshes with flexible ASCII or binary element properties through common mesh data shapes.
hide_title: true
page_style: designed
---

import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Mesh format"
  title="A flexible interchange for polygon geometry."
  description="PLY describes vertices, faces, and additional element properties in a simple header-driven file. loaders.gl turns supported data into common mesh or Mesh Arrow output and can write compatible ASCII files."
  tone="pink"
  meta={['ASCII and binary', 'Mesh attributes', 'Mesh Arrow output']}
  links={[
    {label: 'PLY module', to: '/docs/modules/ply'},
    {label: 'PLYLoader', to: '/docs/modules/ply/api-reference/ply-loader'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<PlyDocsTabs active="format" />

<DocOrientation
  eyebrow="Polygon data path"
  title="Read the elements, keep the useful attributes."
  description="PLY files can vary in element names, property layouts, and storage encoding. The loader handles the supported combinations and exposes geometry through the same mesh contract as other formats."
  tone="pink"
  items={[
    {label: 'Header', value: 'Declare elements, properties, counts, and storage encoding.'},
    {label: 'Decode', value: 'Read vertices, faces, colors, normals, and supported attributes.'},
    {label: 'Output', value: 'Return Mesh objects or Mesh Arrow tables.'},
    {label: 'Write', value: 'Encode compatible mesh data as ASCII PLY text.'}
  ]}
/>

<ReferenceBoundary
  title="PLY format and API details"
  description="The reference below covers header syntax, element/property handling, encodings, decoded attributes, and writer behavior."
  tone="pink"
/>

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/ply/api-reference/ply-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>PLYLoader</strong>
    <span>Loads PLY meshes as Mesh objects or Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/ply/api-reference/ply-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>PLYWriter</strong>
    <span>Writes Mesh or Mesh Arrow table data as ASCII PLY text.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync, encodeTextSync</span>
  </a>
</div>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [PLY](/docs/modules/ply/formats/ply)                                                       |
| Data Format          | [Mesh](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extension       | `.ply`                                                                                     |
| MIME Type            | Not standardized                                                                           |
| File Type            | Binary/Text                                                                                |
| Loader Decoder Type  | Synchronous                                                                                |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
| Writer File Type     | Text                                                                                       |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                   |

## Supported Encodings

PLY supports ASCII, binary little-endian, and binary big-endian encodings. `PLYWriter` currently writes ASCII PLY text.

## Mesh Data

PLY files describe mesh elements such as vertices and faces. `PLYLoader` maps common vertex properties to Mesh attributes by default, or Mesh Arrow table columns when `ply.shape: 'arrow-table'` is selected. Common attributes include `POSITION`, `NORMAL`, `TEXCOORD_0`, and `COLOR_0`.
