---
title: '@loaders.gl/gltf'
description: Load, inspect, transform, and write glTF and GLB scene assets.
hide_title: true
page_style: designed
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {ThreeDDataFormatsGraphic} from '@site/src/components/docs/three-d-data-formats-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="gltf"
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

<ThreeDDataFormatsGraphic />

The `@loaders.gl/gltf` module provides loaders and writers of the GLB/glTF formats.

<DocOrientation
  eyebrow="The glTF module"
  title="Keep the scene graph, add the processing you need."
  description="The module exposes standards-shaped scene data while providing focused APIs for traversal, writing, compression, and conversion into application-friendly geometry."
  tone="pink"
  items={[
    {label: 'Read', value: 'Load glTF and GLB with linked resources resolved on demand'},
    {label: 'Traverse', value: 'Inspect nodes, meshes, materials, and extensions lazily'},
    {label: 'Process', value: 'Handle Draco, meshopt, thumbnails, and derived data'},
    {label: 'Write', value: 'Build or encode scenegraphs and compatible binary assets'}
  ]}
/>

<ReferenceBoundary
  title="Module APIs and format boundaries"
  description="The reference below covers installation, scenegraph helpers, GLB containers, extension handling, compression, and writers."
  tone="pink"
/>

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

Use the core writer API to encode loaded glTF data:

```typescript
import {encode} from '@loaders.gl/core';
import {GLTFLoader, GLTFWriter} from '@loaders.gl/gltf';
import {load} from '@loaders.gl/core';

const gltf = await load(url, GLTFLoader);
const arrayBuffer = await encode(gltf, GLTFWriter);
```

`GLTFWriter` emits a binary GLB container. The input needs the glTF JSON and loaded
buffers; a post-processed renderer object is not a substitute for that structure.

## GLTF Post Processing

Rendering postprocessing and resolved glTF types are owned by [`@luma.gl/gltf`](https://luma.gl/docs/api-reference/gltf/post-process-gltf). Loaders return indexed JSON and decoded resources; use accessor helpers or `GLTFIterator` for traversal and editing.

Context: the glTF data object returned by the GLTF loader contains the "raw" glTF JSON structure (to ensure generality and "data fidelity" reasons). However, most applications that are going to use the glTF data to visualize it in (typically in WebGL) will need to do some processing of the loaded data before using it.

## Using GLB as a "Binary Container" for Arbitrary Data

The GLB binary container format used by glTF addresses a general need to store a mix of JSON and binary data, and can potentially be used as a foundation for building custom loaders and writers.

Use `GLBLoader` and `GLBWriter` for the binary container without glTF scene processing. `GLTFBuilder`, `GLTFParser`, and `GLBBuilder` are removed APIs.

## glTF Extension Support

Certain glTF extensions are fully or partially supported by the glTF classes. For details on which extensions are supported, see [glTF Extensions](/docs/modules/gltf/formats/gltf#gltf-extensions).

[Spatial audio support](/docs/modules/gltf/formats/gltf#spatial-audio) covers registered
`MPEG_audio_spatial` metadata and draft `KHR_audio_emitter` resources and attachments. The loader
returns encoded clips and audio declarations for the application's audio runtime.

[Typed extension metadata and permissive validation](/docs/modules/gltf/formats/gltf#typed-extension-metadata-and-permissive-validation)
covers material variants, GPU instancing, animation pointers, node visibility and interaction
flags, and XMP metadata. Public schemas preserve unknown properties and omitted defaults.
Use `getMaterialVariantMappings`, `getMeshInstances`, and `getXMPMetadata` to resolve metadata
references while retaining the original glTF document.


[Interactivity graphs](/docs/modules/gltf/formats/gltf#khr_interactivity) are preserved as typed
metadata and exposed by `getGLTFInteractivity`; the application runtime executes them.

## Draco Mesh and Point Cloud Compression

`GLTFLoader` decodes supported Draco extensions when `gltf.decompressMeshes` is
enabled. `GLTFWriter` can add Draco-compressed triangle primitives with
`gltf.draco.enabled: true`; this requires asynchronous `encode`.

```typescript
const bytes = await encode(gltf, GLTFWriter, {gltf: {draco: {enabled: true}}});
```

See the [writer reference](/docs/modules/gltf/api-reference/gltf-writer) for limits and options.


### Meshopt decoder

The maintained meshoptimizer decoder is bundled in @loaders.gl/gltf and loaded
only on the first meshopt-compressed buffer decode. Applications do not need to
install meshoptimizer, including when bundling the loader for a browser. Ordinary
glTF parsing does not initialize the decoder.

## Lazy resource access

`GLTFSource` opens a glTF or GLB document without loading linked resources or decoding
extensions. It preserves the original JSON and provides scene traversal and lazy byte access:

```typescript
import {GLTFSource} from '@loaders.gl/gltf';

const source = await GLTFSource.open('https://example.com/model.glb');
try {
  for (const {index, node} of source.traverse()) {
    console.log(index, node.name);
  }
  const buffer = await source.resolveBuffer(0);
  const bytes = new Uint8Array(buffer.arrayBuffer, buffer.byteOffset, buffer.byteLength);
} finally {
  source.close();
}
```

`getScene(index)` and `getNode(index)` return original JSON definitions. `traverse(sceneIndex)`
visits nodes depth first, rejecting cycles and paths deeper than `maxDepth` (default `256`,
with scene roots at depth zero). `open(url, {fetch, maxDepth})` accepts a custom fetch function.
Resource URLs resolve relative to the final root response URL after redirects.

`resolveBuffer(index)` returns embedded GLB bytes or fetches a buffer URI on demand.
`resolveFile(index)` resolves a draft glTF 2.1 `files` entry from its URI or buffer view.
Both return byte ranges; always honor `byteOffset` and `byteLength`. Requests and downloaded
bytes are shared by URL. Failed requests can be retried. `close()` aborts outstanding resource
requests, releases source-owned byte references, and prevents further operations. Byte ranges
already retained by the caller remain usable.

This initial API does not traverse external assets, decode images or compressed geometry,
normalize glTF 1, evict individual resources, or expose per-request cancellation.

## Direct accessor data

Use [glTF accessor helpers](/docs/modules/gltf/api-reference/gltf-accessors) to read packed typed
values from indexed `GLTFWithBuffers` data or replace accessor storage. The helpers support sparse,
interleaved, implicit-zero and decoder-provided accessors without linking the scene graph.
