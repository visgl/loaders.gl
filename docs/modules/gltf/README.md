---
title: '@loaders.gl/gltf'
description: Load, inspect, transform, and write glTF and GLB scene assets.
hide_title: true
page_style: designed
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="Scenegraph module"
  title="@loaders.gl/gltf"
  description="Bring glTF and GLB scenes into an application with linked assets, compressed meshes, typed traversal, and a standards-shaped result."
  tone="pink"
  meta={['glTF and GLB', 'Scenegraph data', 'Draco and meshopt']}
  links={[
    {label: 'glTF format', to: '/docs/modules/gltf/formats/gltf'},
    {label: 'GLTFLoader', to: '/docs/modules/gltf/api-reference/gltf-loader'},
    {label: 'Try glTF', to: '/examples/gltf'}
  ]}
/>

<GltfDocsTabs active="overview" />

![logo](./images/gltf-small.png)

The `@loaders.gl/gltf` module provides loaders and writers of the GLB/glTF formats.

## Installation

```bash
npm install @loaders.gl/gltf
npm install @loaders.gl/core
```

Optionally, to support Draco encoded gltf files

```bash
npm install @loaders.gl/draco
```

## GLTFIterator API

The [`GLTFIterator`](/docs/modules/gltf/api-reference/gltf-iterator) class provides lazy, typed traversal of the original glTF JSON. It is intended for extension handlers and applications that need resolved references while retaining and optionally transforming the standards-shaped source document.

## GLTFScenegraph API

To simplify traversing and building glTF data objects, the [`GLTFScenegraph`](/docs/modules/gltf/api-reference/gltf-scenegraph) class can be used.

A glTF data object can also be built programmatically using the GLTFScenegraph's "fluent API":

```typescript
import {encode} from '@loaders.gl/gltf';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
const gltfScenegraph = new GLTFScenegraph()
  .addApplicationData(...)
  .addExtras(...)
  .addExtension(...)
  .addRequiredExtension(...);

const arrayBuffer = encode(gltfScenegraph, GLTFWriter);
```

## GLTF Post Processing

The [`postProcessGLTF`](/docs/modules/gltf/api-reference/post-process-gltf) function implements a number of transformations on the loaded glTF data that would typically need to be performed by the application after loading the data, and is provided as an optional function that applications can call after loading glTF data. Refer to the reference page for details on what transformations are performed.

Context: the glTF data object returned by the GLTF loader contains the "raw" glTF JSON structure (to ensure generality and "data fidelity" reasons). However, most applications that are going to use the glTF data to visualize it in (typically in WebGL) will need to do some processing of the loaded data before using it.

## Using GLB as a "Binary Container" for Arbitrary Data

The GLB binary container format used by glTF addresses a general need to store a mix of JSON and binary data, and can potentially be used as a foundation for building custom loaders and writers.

To allow for this (and also to generally improve the glTF code structure), the `GLTFLoader` and `GLTFBuilder` classes are built on top of GLB focused classes (`GLBLoader` and `GLBBuilder`) that can be used independently of the bigger glTF classes.

## glTF Extension Support

Certain glTF extensions are fully or partially supported by the glTF classes. For details on which extensions are supported, see [glTF Extensions](/docs/modules/gltf/formats/gltf#gltf-extensions).

## Draco Mesh and Point Cloud Compression

Draco encoding and decoding is supported by the `GLTFBuilder` and `GLTFParser` classes but requires the DracoWriter and DracoLoader dependencies to be "injected" by the application.

```typescript
import {GLTFBuilder} from '@loaders.gl/gltf';
import {DracoWriter, DracoLoader} from '@loaders.gl/draco';

const gltfBuilder = new GLTFBuilder({DracoWriter, DracoLoader});
```
