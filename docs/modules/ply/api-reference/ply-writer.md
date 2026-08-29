---
title: PLYWriter
description: Encode Mesh or Mesh Arrow table data as PLY text.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

<DocPageHeader
  eyebrow="PLY writer"
  title="Write common mesh data into a portable text format."
  description="`PLYWriter` accepts legacy Mesh objects and Mesh Arrow tables, normalizes their common attributes, and writes ASCII Polygon File Format output for tools and pipelines that speak PLY."
  tone="mint"
  meta={['PLY text', 'Mesh and Arrow table', 'Vertices and faces']}
  links={[
    {label: 'PLY module', to: '/docs/modules/ply'},
    {label: 'PLY format', to: '/docs/modules/ply/formats/ply'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<DocOrientation
  eyebrow="The PLY writing path"
  title="Normalize the mesh. Emit a file other tools can read."
  description="The writer keeps format delivery separate from the application’s mesh representation, carrying standard vertex attributes and faces into a simple PLY schema."
  tone="mint"
  items={[
    {label: 'Input', value: 'Mesh or Mesh Arrow table'},
    {label: 'Attributes', value: 'Position, normal, UV, color, and custom scalars'},
    {label: 'Topology', value: 'Indexed or sequential triangle faces'},
    {label: 'Output', value: 'ASCII PLY text or encoded bytes'}
  ]}
/>

<PlyDocsTabs active="plywriter" />

<ReferenceBoundary
  title="PLY output details"
  description="The reference below covers accepted mesh shapes, written attributes, faces, and encoding entry points."
  tone="mint"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `PLYWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data as ASCII Polygon File Format (PLY) text.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {PLYWriter} from '@loaders.gl/ply';

declare const mesh: Mesh | MeshArrowTable;

const arrayBuffer = await encode(mesh, PLYWriter);
const text = PLYWriter.encodeTextSync(mesh);
```

## Data Format

`PLYWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before PLY text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL`, `TEXCOORD_0`, and `COLOR_0` attributes when present. One-component custom attributes are written as scalar vertex properties. Indexed meshes are written as PLY faces; non-indexed triangle-list meshes are written as sequential triangle faces.

## Options

`PLYWriter` does not currently define format-specific options.
