---
title: Scenegraph category
description: Keep hierarchical scene descriptions intact while they move from files into applications.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader category"
  title="Keep the scene hierarchy until the renderer needs it."
  description="Scenegraph loaders preserve nodes, meshes, materials, transforms, and extensions as a structured representation. That lets applications inspect, transform, or render a scene without flattening it during decode."
  tone="pink"
  links={[
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'glTF format', to: '/docs/modules/gltf/formats/gltf'}
  ]}
/>

<DocOrientation
  eyebrow="A scene is more than a mesh"
  title="Decode the relationships as well as the bytes."
  description="A scenegraph carries the hierarchy that connects geometry, materials, animations, and transforms. The category keeps those relationships available to an application-specific renderer or converter."
  tone="pink"
  items={[
    {label: 'Scene files', value: 'glTF, GLB, and OpenUSD'},
    {label: 'Preserves', value: 'Nodes, meshes, materials, transforms, animations, and extensions'},
    {label: 'Payloads', value: 'Binary buffers, images, compressed geometry, and textures'},
    {label: 'Output', value: 'Typed scene data close to the source format'}
  ]}
/>

The Scenegraph category represents hierarchical 3D scene descriptions. Each loader returns a
typed representation close to its source format.

<ReferenceBoundary
  title="The scenegraph data model"
  description="The sections below document the loaders and the source-shaped data structures they return."
  tone="pink"
/>

## Loaders

| Loader                                                       | Notes |
| ------------------------------------------------------------ | ----- |
| [`GLTFLoader`](/docs/modules/gltf/api-reference/gltf-loader) |       |
| [`GLBLoader`](/docs/modules/gltf/api-reference/glb-loader)   |       |
| [`USDLoader`](/docs/modules/scene/api-reference/usd-loader)   |       |

## glTF Data Format

The data format is fairly raw, close to the unpacked glTF/GLB data structure, it is described by:

- a parsed JSON object (with top level arrays for `scenes`, `nodes` etc)
- a list of `ArrayBuffer`s representing binary blocks (into which `bufferViews` and `images` in the JSON point).

## Data Structure

A JSON object with the following top-level fields:

| Field     | Type            | Default | Description                                              |
| --------- | --------------- | ------- | -------------------------------------------------------- |
| `magic`   | `Number`        | glTF    | The first four bytes of the file                         |
| `version` | `Number`        | `2`     | The version number                                       |
| `json`    | `Object`        | `{}`    | The JSON chunk                                           |
| `buffers` | `ArrayBuffer[]` | `[]`    | (glTF) The BIN chunk plus any base64 or BIN file buffers |

Buffers can be objects in the shape of `{buffer, byteOffset, byteLength}`.

## Helper Classes

To simplify higher-level processing of the loaded, raw glTF data, several helper classes are provided in the `@loaders.gl/gltf` module, these can:

- unpack and remove certain glTF extensions
- extract typed array views from the JSON objects into the binary buffers
- create HTML images from image buffers
- etc

## OpenUSD Data Format

`USDLoader` returns a `USDStage` with root-layer metadata, a hierarchy of typed `USDPrim` objects,
and the URLs of layers used during composition. See the
[`USDLoader`](/docs/modules/scene/api-reference/usd-loader) reference for supported OpenUSD
features and current limitations.
