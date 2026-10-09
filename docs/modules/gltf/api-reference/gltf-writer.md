---
title: GLTFWriter
description: Encode scenegraph data as glTF or GLB.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="gltf"
  eyebrow="glTF writer"
  title="Write a glTF scenegraph as a binary GLB."
  description="`GLTFWriter` encodes glTF JSON and loaded buffers as a binary GLB, with optional asynchronous Draco compression."
  tone="mint"
  meta={['GLB output', 'Scenegraph input', 'Optional Draco']}
  links={[
    {label: 'glTF module', to: '/docs/modules/gltf'},
    {label: 'glTF format', to: '/docs/modules/gltf/formats/gltf'},
    {label: 'Scenegraph category', to: '/docs/specifications/category-scenegraph'}
  ]}
/>

<DocOrientation
  eyebrow="The scenegraph writing path"
  title="Build a portable scene file from common scene data."
  description="The writer takes the loaders.gl scenegraph representation and assembles the JSON, buffers, images, and optional compression extensions required by the target glTF container."
  tone="mint"
  items={[
    {label: 'Input', value: 'Loaders.gl scenegraph data'},
    {label: 'Assembly', value: 'Nodes, meshes, materials, buffers, and images'},
    {label: 'Compression', value: 'Optional asynchronous Draco compression'},
    {label: 'Output', value: '`.glb` binary'}
  ]}
/>

<ReferenceBoundary
  title="Writer options and output details"
  description="The reference below covers usage, output formats, optional Draco integrations, synchronous encoding, and scenegraph requirements."
  tone="mint"
/>

The `GLTFWriter` is a writer for glTF scenegraphs.

| Loader          | Characteristic                                                             |
| --------------- | -------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                             |
| File Types      | Binary                                                |
| Data Format     | [Scenegraph](/docs/specifications/category-scenegraph)                     |
| File Format     | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Supported APIs  | `encode`, `encodeSync`                                                     |

## Usage

```typescript
import {GLTFWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLTFWriter, options);
```

Materials annotated by the loader with `unlit: true` are written as required
`KHR_materials_unlit` extensions. Existing raw optional unlit extensions remain optional.
The writer omits empty extension declarations and does not invent a binary buffer or BIN chunk
for assets without binary data. These repairs do not establish full glTF conformance.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `gltf.draco.enabled` | `boolean` | `false` | Generate `KHR_draco_mesh_compression` payloads with async `encode`. |
| `gltf.draco.skipUnsupportedPrimitives` | `boolean` | `true` | Leave non-triangle primitives unchanged; set to `false` to reject them. |
| `byteOffset` | `number` | `0` | Byte offset passed to binary container encoding. |

Additional Draco build settings are accepted under `gltf.draco`. Input data is not
modified. Compression currently requires at most one loaded buffer; original
accessors remain available for consumers that do not decode the extension.
`encodeSync` throws when Draco compression is enabled. JSON `.gltf` files and
separate-asset output are not supported by this writer.
