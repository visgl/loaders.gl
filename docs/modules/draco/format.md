---
title: Draco format
description: Compress and decompress triangle meshes and point clouds while retaining a shared geometry data shape.
hide_title: true
page_style: designed
---

import {DracoDocsTabs} from '@site/src/components/docs/draco-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geometry compression"
  title="Smaller geometry, the same application shape."
  description="Draco compresses triangle meshes and point clouds for delivery. loaders.gl decodes its attributes into common mesh data and can encode compatible data back into Draco payloads."
  tone="pink"
  meta={['Mesh and point cloud', 'Attribute compression', 'Worker-capable decode']}
  links={[
    {label: 'Draco module', to: '/docs/modules/draco'},
    {label: 'DracoLoader', to: '/docs/modules/draco/api-reference/draco-loader'},
    {label: 'DracoWriter', to: '/docs/modules/draco/api-reference/draco-writer'}
  ]}
/>

<DracoDocsTabs active="format" />

<DocOrientation
  eyebrow="Compressed geometry"
  title="Transport geometry compactly, decode it where it is needed."
  description="Draco represents geometry attributes using specialized compression. The loaders.gl boundary keeps the compressed payload format-specific while exposing decoded attributes through the mesh category."
  tone="pink"
  items={[
    {label: 'Geometry', value: 'Triangle meshes and point clouds with supported attributes.'},
    {label: 'Compression', value: 'Quantization and prediction reduce delivery size.'},
    {label: 'Decode', value: 'Return Mesh objects or Mesh Arrow tables.'},
    {label: 'Encode', value: 'Write compatible mesh data as Draco binary.'}
  ]}
/>

<ReferenceBoundary
  title="Draco format and API details"
  description="The reference below covers encoded geometry, attributes, compression behavior, worker loading, and writer compatibility."
  tone="pink"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Draco](/docs/modules/draco/formats/draco)                                                  |
| Data Format          | [Mesh](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extension       | `.drc`                                                                                     |
| MIME Type            | `application/octet-stream`                                                                 |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseSync`                                                               |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
| Writer APIs          | `encode`, `encodeSync`                                                                     |

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/draco/api-reference/draco-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>DracoLoader</strong>
    <span>Loads Draco meshes and point clouds as Mesh objects or Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/draco/api-reference/draco-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>DracoWriter</strong>
    <span>Encodes Mesh or Mesh Arrow table data as Draco binary data.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

## Encodings

Draco stores compressed mesh and point cloud geometry. It supports triangle meshes and point clouds, and can preserve supported attribute arrays and metadata dictionaries.

## Runtime

`DracoLoader` and `DracoWriter` use the official Draco3D 1.5.7 decoder and encoder runtimes. The WebAssembly runtimes are loaded dynamically by default, are also published as package-local assets for workers and offline applications, and can be supplied through `options.modules`.
