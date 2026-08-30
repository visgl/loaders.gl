---
title: GLTFWriter
description: Encode scenegraph data as glTF or GLB.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="glTF writer"
  title="Write a scenegraph back to glTF or GLB."
  description="`GLTFWriter` turns loaders.gl scenegraph data into glTF or GLB output. Optional Draco integrations let applications control mesh compression without putting that dependency into every glTF pipeline."
  tone="mint"
  meta={['glTF and GLB', 'Scenegraph output', 'Optional Draco']}
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
    {label: 'Compression', value: 'Optional Draco loader/writer integrations'},
    {label: 'Output', value: '`.gltf` JSON or `.glb` binary'}
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
| File Extensions | `.glb`,`.gltf`                                                             |
| File Types      | Binary, JSON, Linked Assets                                                |
| Data Format     | [Scenegraph](/docs/specifications/category-scenegraph)                     |
| File Format     | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Supported APIs  | `encode`, `encodeSync`                                                     |

## Usage

```typescript
import {GLTFWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLTFWriter, options);
```

## Options

| Option        | Type                                                          | Default | Description                                                                                   |
| ------------- | ------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `DracoWriter` | [DracoWriter](/docs/modules/draco/api-reference/draco-writer) | `null`  | To enable DRACO encoding, the application needs to import and supply the `DracoWriter` class. |
| `DracoLoader` | [DracoLoader](/docs/modules/draco/api-reference/draco-loader) | `null`  | To enable DRACO encoding, the application needs to import and supply the `DracoLoader` class. |
