<!-- -->

<!-- -->

scene format

# STL — triangle meshes

Read the triangle surface exchanged by CAD and fabrication tools.

[scene module](https://loaders.gl/docs/modules/scene.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/scene.md)

Format feature card

## Read STL as data.

Surface triangles; units remain application-defined

01

Input

ASCII and little-endian binary

02

Output

Mesh with float32 positions and facet normals

03

Loader

STLLoader · @loaders.gl/scene

04

Parser

@loaders.gl/scene/stl

:::note Availability

This page documents the initial implementation in [PR #4409](https://github.com/visgl/loaders.gl/pull/4409). Use a version containing that change; this guide does not imply availability in older published versions.

:::

Detailed guide

## Format, usage and output reference

Understand the source data, load it through the public entry point, and check the supported subset before integrating it.

## What is STL?[​](#what-is-stl "Direct link to What is STL?")

STL describes a surface as independent triangular facets. Each facet carries a normal and three vertex coordinates. It is commonly used to exchange CAD surfaces for fabrication, printing, and inspection. A file does not supply a scene hierarchy, material system, or reliable unit convention. A coordinate of 10 could mean millimeters, inches, or another unit chosen by the producer.

ASCII STL uses records such as `solid`, `facet normal`, `outer loop`, and `vertex`. Binary STL starts with an 80-byte header and a 32-bit triangle count, followed by 50 bytes per triangle. A binary header can begin with the word `solid`; the loader uses the exact binary length rather than trusting that word alone.

## Load a mesh[​](#load-a-mesh "Direct link to Load a mesh")

```
import {load} from '@loaders.gl/core';

import {STLLoader} from '@loaders.gl/scene/stl';



const mesh = await load('part.stl', STLLoader);

const positions = mesh.attributes.POSITION.value;

const normals = mesh.attributes.NORMAL.value;

const triangleCount = mesh.header.vertexCount / 3;
```

## Output contract[​](#output-contract "Direct link to Output contract")

| Field                 | Meaning                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `topology`            | `triangle-list`; every three consecutive vertices form one triangle |
| `attributes.POSITION` | Float32 XYZ samples with `size: 3`                                  |
| `attributes.NORMAL`   | Authored facet normal repeated for each of its three vertices       |
| `header.vertexCount`  | Expanded vertex count; vertices are not welded                      |
| `header.boundingBox`  | Bounds derived from the decoded positions                           |
| `schema`              | Mesh attribute schema                                               |
| `loaderData`          | Source header text and detected ASCII/binary representation         |

Normals are preserved, not recalculated or normalized. Vertex winding remains in source order. Multiple ASCII solids are flattened into one mesh in file order. Applications decide units, transforms, indexing, materials, and rendering.

## Supported features and limits[​](#supported-features-and-limits "Direct link to Supported features and limits")

| Supported                                                | Outside the initial scope              |
| -------------------------------------------------------- | -------------------------------------- |
| ASCII keywords in any case; tabs and repeated whitespace | Retaining solid groups                 |
| Binary triangles with exact declared payload length      | Vendor attribute/color conventions     |
| Finite coordinates and normals, schema and bounds        | Vertex welding, normal repair, writers |

Malformed facets, truncated binary payloads, trailing bytes that disagree with the declared triangle count, and non-finite or float32-overflowing geometry reject. Binary attribute bytes do not become material colors.

## Direct parsing[​](#direct-parsing "Direct link to Direct parsing")

```
import {parseSync} from '@loaders.gl/core';

import {STLLoaderWithParser} from '@loaders.gl/scene/stl/bundled';



const mesh = parseSync(bytes, STLLoaderWithParser);
```

The root export contains metadata and preloads its parser through async core APIs. There are no STL-specific options. Parsing materializes the entire mesh; there is no streaming or worker descriptor in this initial API.

## Choosing a format[​](#choosing-a-format "Direct link to Choosing a format")

Use STL when the triangle surface is the asset. Use [glTF](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md) when materials, nodes, textures, and animation must travel with the geometry. For scientific cell topology and associated fields, see [VTK](https://loaders.gl/docs/modules/scientific/vtk.md).
