---
title: OBJWriter
description: Encode Mesh or Mesh Arrow table data as Wavefront OBJ text.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';

<DocPageHeader
  eyebrow="OBJ writer"
  title="Write common mesh data into a format every 3D tool knows."
  description="`OBJWriter` accepts legacy Mesh objects and Mesh Arrow tables, then emits Wavefront OBJ text with the standard vertex attributes and faces that downstream tools expect."
  tone="mint"
  meta={['Wavefront OBJ', 'Mesh and Arrow table', 'Portable text output']}
  links={[
    {label: 'OBJ module', to: '/docs/modules/obj'},
    {label: 'OBJ format', to: '/docs/modules/obj/formats/obj'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<DocOrientation
  eyebrow="The OBJ writing path"
  title="Start with common mesh data. Emit portable geometry text."
  description="The writer normalizes the legacy and Arrow-backed mesh inputs at the boundary, then writes positions, optional attributes, and indexed or sequential triangle faces."
  tone="mint"
  items={[
    {label: 'Input', value: 'Mesh or Mesh Arrow table'},
    {label: 'Attributes', value: 'Position, normal, UV, color, and custom scalars'},
    {label: 'Topology', value: 'Indexed or sequential triangle faces'},
    {label: 'Output', value: 'Wavefront OBJ text or encoded bytes'}
  ]}
/>

<ObjDocsTabs active="objwriter" />

<ReferenceBoundary
  title="OBJ output details"
  description="The reference below covers accepted mesh shapes, written attributes, face output, and encoding entry points."
  tone="mint"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `OBJWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data as Wavefront OBJ text.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {OBJWriter} from '@loaders.gl/obj';

declare const mesh: Mesh | MeshArrowTable;

const arrayBuffer = await encode(mesh, OBJWriter);
const text = OBJWriter.encodeTextSync(mesh);
```

## Data Format

`OBJWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before OBJ text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL`, `TEXCOORD_0`, and `COLOR_0` attributes when present. Indexed meshes are written as OBJ faces; non-indexed triangle-list meshes are written as sequential triangle faces.

## Options

`OBJWriter` does not currently define format-specific options.
