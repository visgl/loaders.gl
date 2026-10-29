Scenegraph module

![](/next/images/format-logos/gltf-logo.svg)

# @loaders.gl/scene/gltf

Bring glTF and GLB scenes into an application with linked assets, compressed meshes, typed traversal, and a standards-shaped result.

[glTF format](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[GLTFLoader](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)[Try glTF](https://loaders.gl/next/examples/gltf)

<!-- -->

[ ↗](https://loaders.gl/next/examples/gltf)

![](/next/images/format-logos/gltf-logo.svg)[Overview](https://loaders.gl/next/docs/modules/scene/gltf.md)[glTF Format](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[GLTFLoader](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)[Iterator](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-iterator.md)[Scenegraph](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-scenegraph.md)[Post-processing](https://luma.gl/docs/api-reference/gltf/post-process-gltf)

A layered 3D format stack

## Choose the delivery layer. Keep the data path.

A scene file, a tiled world, and a compressed payload solve different problems. loaders.gl keeps those boundaries visible while providing the readers needed to move between them.

Scene descriptions

Hierarchy, materials, transforms, and animation

[glTF 2.0 + draft 2.1↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[GLB↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)[OpenUSD↗](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

Tiled worlds and point clouds

Spatial hierarchy, level of detail, and selective delivery

[3D Tiles 1.0 / 1.1↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[I3S 1.7 / 1.8 + PC 2.x↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[COPC 1.0 · Potree 1.x↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

Geometry and texture payloads

Compression and GPU-ready delivery underneath the formats

[Draco↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Meshopt compression↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#meshopt-compression)[Basis Universal / KTX2↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)

Application-facing results

scenegraphtile contentMesh / point-listTextureLevel

The `@loaders.gl/scene/gltf` module provides loaders and writers of the GLB/glTF formats.

The glTF module

## Keep the scene graph, add the processing you need.

The module exposes standards-shaped scene data while providing focused APIs for traversal, writing, compression, and conversion into application-friendly geometry.

01

Read

Load glTF and GLB with linked resources resolved on demand

02

Traverse

Inspect nodes, meshes, materials, and extensions lazily

03

Process

Handle Draco, meshopt, thumbnails, and derived data

04

Write

Build or encode scenegraphs and compatible binary assets

Detailed guide

## Module APIs and format boundaries

The reference below covers installation, scenegraph helpers, GLB containers, extension handling, compression, and writers.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/scene

npm install @loaders.gl/core
```

Optionally, to support Draco encoded gltf files

```
npm install @loaders.gl/draco
```

## GLTFIterator API[​](#gltfiterator-api "Direct link to GLTFIterator API")

The [`GLTFIterator`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-iterator.md) class provides lazy, typed traversal of the original glTF JSON. It is intended for extension handlers and applications that need resolved references while retaining and optionally transforming the standards-shaped source document.

## GLTFScenegraph API[​](#gltfscenegraph-api "Direct link to GLTFScenegraph API")

To simplify traversing and building glTF data objects, the [`GLTFScenegraph`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-scenegraph.md) class can be used.

Use the core writer API to encode loaded glTF data:

```
import {encode} from '@loaders.gl/core';

import {GLTFLoader, GLTFWriter} from '@loaders.gl/scene/gltf';

import {load} from '@loaders.gl/core';



const gltf = await load(url, GLTFLoader);

const arrayBuffer = await encode(gltf, GLTFWriter);
```

`GLTFWriter` emits a binary GLB container. The input needs the glTF JSON and loaded buffers; a post-processed renderer object is not a substitute for that structure.

## GLTF Post Processing[​](#gltf-post-processing "Direct link to GLTF Post Processing")

Rendering postprocessing and resolved glTF types are owned by [`@luma.gl/gltf`](https://luma.gl/docs/api-reference/gltf/post-process-gltf). Loaders return indexed JSON and decoded resources; use accessor helpers or `GLTFIterator` for traversal and editing.

Context: the glTF data object returned by the GLTF loader contains the "raw" glTF JSON structure (to ensure generality and "data fidelity" reasons). However, most applications that are going to use the glTF data to visualize it in (typically in WebGL) will need to do some processing of the loaded data before using it.

## Using GLB as a "Binary Container" for Arbitrary Data[​](#using-glb-as-a-binary-container-for-arbitrary-data "Direct link to Using GLB as a \"Binary Container\" for Arbitrary Data")

The GLB binary container format used by glTF addresses a general need to store a mix of JSON and binary data, and can potentially be used as a foundation for building custom loaders and writers.

Use `GLBLoader` and `GLBWriter` for the binary container without glTF scene processing. `GLTFBuilder`, `GLTFParser`, and `GLBBuilder` are removed APIs.

## glTF Extension Support[​](#gltf-extension-support "Direct link to glTF Extension Support")

Certain glTF extensions are fully or partially supported by the glTF classes. For details on which extensions are supported, see [glTF Extensions](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#gltf-extensions).

[Spatial audio support](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#spatial-audio) covers registered `MPEG_audio_spatial` metadata and draft `KHR_audio_emitter` resources and attachments. The loader returns encoded clips and audio declarations for the application's audio runtime.

[Typed extension metadata and permissive validation](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#typed-extension-metadata-and-permissive-validation) covers material variants, GPU instancing, animation pointers, node visibility and interaction flags, and XMP metadata. Public schemas preserve unknown properties and omitted defaults. Use `getMaterialVariantMappings`, `getMeshInstances`, and `getXMPMetadata` to resolve metadata references while retaining the original glTF document.

[Interactivity graphs](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#khr_interactivity) are preserved as typed metadata and exposed by `getGLTFInteractivity`; the application runtime executes them.

## Draco Mesh and Point Cloud Compression[​](#draco-mesh-and-point-cloud-compression "Direct link to Draco Mesh and Point Cloud Compression")

`GLTFLoader` decodes supported Draco extensions when `gltf.decompressMeshes` is enabled. `GLTFWriter` can add Draco-compressed triangle primitives with `gltf.draco.enabled: true`; this requires asynchronous `encode`.

```
const bytes = await encode(gltf, GLTFWriter, {gltf: {draco: {enabled: true}}});
```

See the [writer reference](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-writer.md) for limits and options.

### Meshopt decoder[​](#meshopt-decoder "Direct link to Meshopt decoder")

The maintained meshoptimizer decoder is bundled in @loaders.gl/scene/gltf and loaded only on the first meshopt-compressed buffer decode. Applications do not need to install meshoptimizer, including when bundling the loader for a browser. Ordinary glTF parsing does not initialize the decoder.

## Lazy resource access[​](#lazy-resource-access "Direct link to Lazy resource access")

`GLTFSource` opens a glTF or GLB document without loading linked resources or decoding extensions. It preserves the original JSON and provides scene traversal and lazy byte access:

```
import {GLTFSource} from '@loaders.gl/scene/gltf';



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

`getScene(index)` and `getNode(index)` return original JSON definitions. `traverse(sceneIndex)` visits nodes depth first, rejecting cycles and paths deeper than `maxDepth` (default `256`, with scene roots at depth zero). `open(url, {fetch, maxDepth})` accepts a custom fetch function. Resource URLs resolve relative to the final root response URL after redirects.

`resolveBuffer(index)` returns embedded GLB bytes or fetches a buffer URI on demand. `resolveFile(index)` resolves a draft glTF 2.1 `files` entry from its URI or buffer view. Both return byte ranges; always honor `byteOffset` and `byteLength`. Requests and downloaded bytes are shared by URL. Failed requests can be retried. `close()` aborts outstanding resource requests, releases source-owned byte references, and prevents further operations. Byte ranges already retained by the caller remain usable.

This initial API does not traverse external assets, decode images or compressed geometry, normalize glTF 1, evict individual resources, or expose per-request cancellation.

## Direct accessor data[​](#direct-accessor-data "Direct link to Direct accessor data")

Use [glTF accessor helpers](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-accessors.md) to read packed typed values from indexed `GLTFWithBuffers` data or replace accessor storage. The helpers support sparse, interleaved, implicit-zero and decoder-provided accessors without linking the scene graph.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
