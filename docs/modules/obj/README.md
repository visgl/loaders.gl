---
title: OBJ module
description: Load and write Wavefront OBJ geometry as reusable mesh data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Text mesh format"
  title="Move simple geometry into a shared mesh path."
  description="The OBJ module reads Wavefront geometry and writes it back as text, exposing positions, normals, texture coordinates, and faces in the mesh shapes used by loaders.gl applications."
  tone="orange"
  meta={['Wavefront OBJ', 'Mesh data', 'Read and write']}
  links={[
    {label: 'OBJ format', to: '/docs/modules/obj/formats/obj'},
    {label: 'OBJLoader', to: '/docs/modules/obj/api-reference/obj-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The mesh path"
  title="Parse text. Reuse the geometry."
  description="OBJ is intentionally straightforward: the module focuses on the geometry payload and returns a mesh representation that can feed rendering, conversion, or Arrow-based processing."
  tone="orange"
  items={[
    {label: 'Read', value: 'Vertices, normals, texture coordinates, and faces'},
    {label: 'Shape', value: 'Mesh objects or Mesh Arrow tables'},
    {label: 'Write', value: 'Compatible mesh data back to OBJ text'},
    {label: 'Boundary', value: 'MTL material workflows remain a separate concern'}
  ]}
/>

The `@loaders.gl/obj` module handles the the [Wavefront OBJ format](/docs/modules/obj/formats/obj), a simple ASCII format that defines 3D geometries as vertices, normals and faces.

<ReferenceBoundary
  title="OBJ module reference"
  description="The sections below cover installation, loader and writer entry points, and the source attribution for the parser."
  tone="orange"
/>

## Installation

```bash
npm install @loaders.gl/obj
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader or Writer                                               | Description                         |
| -------------------------------------------------------------- | ----------------------------------- |
| [`OBJLoader`](/docs/modules/obj/api-reference/obj-loader)      | Loads OBJ meshes as Mesh objects or Mesh Arrow tables. |
| [`OBJWriter`](/docs/modules/obj/api-reference/obj-writer)      | Writes Mesh or Mesh Arrow table data as OBJ text. |

## Attribution

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.
