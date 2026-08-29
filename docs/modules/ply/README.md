---
title: PLY module
description: Load and write Polygon File Format meshes and point-cloud-style vertex data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Polygon and vertex format"
  title="Describe a mesh as elements and properties."
  description="The PLY module reads flexible vertex and face elements in ASCII or binary form, preserving common properties such as colors, normals, texture coordinates, and confidence values."
  tone="orange"
  meta={['PLY 1.0', 'Vertices and faces', 'ASCII and binary']}
  links={[
    {label: 'PLY format', to: '/docs/modules/ply/formats/ply'},
    {label: 'PLYLoader', to: '/docs/modules/ply/api-reference/ply-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The element model"
  title="Read the header, then read the elements it describes."
  description="PLY headers declare element counts and properties before the payload. This makes the format flexible enough for meshes and useful for point-cloud-style vertex data."
  tone="orange"
  items={[
    {label: 'Header', value: 'Format, elements, property types, and counts'},
    {label: 'Vertices', value: 'Positions plus optional normals, color, or UVs'},
    {label: 'Faces', value: 'Variable-length index lists and face properties'},
    {label: 'Output', value: 'Mesh objects or Mesh Arrow tables'}
  ]}
/>

The `@loaders.gl/ply` module handles the the [Polygon file format](/docs/modules/ply/formats/ply), a file format for 3D graphical objects described as a collection of polygons that is sometimes used to store point clouds.

<ReferenceBoundary
  title="PLY module reference"
  description="The sections below cover installation, loader and writer entry points, and the parser attribution."
  tone="orange"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/ply
```

## Loaders and Writers

| Loader or Writer                                              | Description                       |
| ------------------------------------------------------------- | --------------------------------- |
| [`PLYLoader`](/docs/modules/ply/api-reference/ply-loader)      | Loads PLY meshes as Mesh objects or Mesh Arrow tables. |
| [`PLYWriter`](/docs/modules/ply/api-reference/ply-writer)      | Writes Mesh or Mesh Arrow table data as ASCII PLY text. |

## Attribution

PLYLoader is a fork of the THREE.js PLYLoader under MIT License. The THREE.js source files contained the following attributions:

@author Wei Meng / http://about.me/menway
