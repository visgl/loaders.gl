---
title: "STL — triangle meshes"
description: "Read the triangle surface exchanged by CAD and fabrication tools."
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="scene format"
  title="STL — triangle meshes"
  description="Read the triangle surface exchanged by CAD and fabrication tools."
  tone="violet"
  meta={["STLLoader","Renderer-independent output","Explicit initial scope"]}
  links={[{label: 'scene module', to: '/docs/modules/scene'}]}
/>

<DocOrientation
  eyebrow="Format feature card"
  title="Read STL as data."
  description="Surface triangles; units remain application-defined"
  tone="violet"
  items={[{"label":"Input","value":"ASCII and little-endian binary"},{"label":"Output","value":"Mesh with float32 positions and facet normals"},{"label":"Loader","value":"STLLoader · @loaders.gl/scene"},{"label":"Parser","value":"@loaders.gl/scene/stl-loader"}]}
/>

:::note Availability

This page documents the initial implementation in [PR #4409](https://github.com/visgl/loaders.gl/pull/4409). Use a version containing that change; this guide does not imply availability in older published versions.

:::

<ReferenceBoundary
  title="Format, usage and output reference"
  description="Understand the source data, load it through the public entry point, and check the supported subset before integrating it."
  tone="violet"
/>

## What is STL?

STL describes a surface as independent triangular facets. Each facet carries a normal and three vertex coordinates. It is commonly used to exchange CAD surfaces for fabrication, printing, and inspection. A file does not supply a scene hierarchy, material system, or reliable unit convention. A coordinate of 10 could mean millimeters, inches, or another unit chosen by the producer.

ASCII STL uses records such as `solid`, `facet normal`, `outer loop`, and `vertex`. Binary STL starts with an 80-byte header and a 32-bit triangle count, followed by 50 bytes per triangle. A binary header can begin with the word `solid`; the loader uses the exact binary length rather than trusting that word alone.

## Load a mesh

```typescript
import {load} from '@loaders.gl/core';
import {STLLoader} from '@loaders.gl/scene';

const mesh = await load('part.stl', STLLoader);
const positions = mesh.attributes.POSITION.value;
const normals = mesh.attributes.NORMAL.value;
const triangleCount = mesh.header.vertexCount / 3;
```

## Output contract

| Field | Meaning |
| --- | --- |
| `topology` | `triangle-list`; every three consecutive vertices form one triangle |
| `attributes.POSITION` | Float32 XYZ samples with `size: 3` |
| `attributes.NORMAL` | Authored facet normal repeated for each of its three vertices |
| `header.vertexCount` | Expanded vertex count; vertices are not welded |
| `header.boundingBox` | Bounds derived from the decoded positions |
| `schema` | Mesh attribute schema |
| `loaderData` | Source header text and detected ASCII/binary representation |

Normals are preserved, not recalculated or normalized. Vertex winding remains in source order. Multiple ASCII solids are flattened into one mesh in file order. Applications decide units, transforms, indexing, materials, and rendering.

## Supported features and limits

| Supported | Outside the initial scope |
| --- | --- |
| ASCII keywords in any case; tabs and repeated whitespace | Retaining solid groups |
| Binary triangles with exact declared payload length | Vendor attribute/color conventions |
| Finite coordinates and normals, schema and bounds | Vertex welding, normal repair, writers |

Malformed facets, truncated binary payloads, trailing bytes that disagree with the declared triangle count, and non-finite or float32-overflowing geometry reject. Binary attribute bytes do not become material colors.

## Direct parsing

```typescript
import {parseSync} from '@loaders.gl/core';
import {STLLoaderWithParser} from '@loaders.gl/scene/stl-loader';

const mesh = parseSync(bytes, STLLoaderWithParser);
```

The root export contains metadata and preloads its parser through async core APIs. There are no STL-specific options. Parsing materializes the entire mesh; there is no streaming or worker descriptor in this initial API.

## Choosing a format

Use STL when the triangle surface is the asset. Use [glTF](../gltf/formats/gltf.md) when materials, nodes, textures, and animation must travel with the geometry. For scientific cell topology and associated fields, see [VTK](../../scientific/vtk/README.md).
