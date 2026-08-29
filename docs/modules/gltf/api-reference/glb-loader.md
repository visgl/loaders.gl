---
title: GLBLoader
description: Split a GLB binary envelope into JSON and binary chunks.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GLB loader"
  title="Open the binary envelope around a glTF asset."
  description="`GLBLoader` parses the GLB container and returns its JSON and binary chunks. Use `GLTFLoader` when the goal is a complete glTF scenegraph; use this lower-level loader when the envelope itself is the data you need."
  tone="blue"
  meta={['GLB v1 and v2', 'JSON and BIN chunks', 'Binary envelope']}
  links={[
    {label: 'glTF module', to: '/docs/modules/gltf'},
    {label: 'GLB format', to: '/docs/modules/gltf/formats/glb'},
    {label: 'GLTFLoader', to: '/docs/modules/gltf/api-reference/gltf-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The GLB boundary"
  title="Read one binary file. Expose its JSON and byte ranges."
  description="GLB packages a JSON chunk and one or more binary chunks into a single file. The loader preserves chunk offsets and lengths so higher-level code can decide how to interpret them."
  tone="blue"
  items={[
    {label: 'Input', value: '`.glb` binary data'},
    {label: 'Envelope', value: 'Header, version, and chunk lengths'},
    {label: 'JSON', value: 'Parsed glTF or application JSON'},
    {label: 'Binary', value: 'One or more ArrayBuffer chunks'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

The `GLBLoader` parses a GLB binary "envelope" extracting the embedded JSON and binary chunks.

:::info[Choose the layer]

- Use `GLTFLoader` when the binary envelope contains a glTF scene and linked resources should be
  resolved for you.
- Use `GLBLoader` when an application needs to inspect, preserve, or reinterpret the JSON and
  binary chunks directly.

:::

| Input | Output | APIs |
| --- | --- | --- |
| `.glb` binary data | Header metadata, parsed JSON, and one or more binary chunks | `load`, `parse`, `parseSync` |

The loader reads GLB v1 and v2 files, plus the draft GLB v3 chunk layout. GLB v1 is returned in
the standard `GLB` shape with `version: 1`; it is not silently presented as a v2 file.

## Usage

<ReferenceBoundary
  title="Container and data-shape details"
  description="The reference below covers supported GLB versions, options, parsed output fields, chunk offsets, and the distinction from GLTFLoader."
  tone="blue"
/>

```typescript
import {load} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLBLoader);
```

## Options

| Option                    | Type    | Default | Description                                                  |
| ------------------------- | ------- | ------- | ------------------------------------------------------------ |
| `glb.strict` (DEPRECATED) | Boolean | `false` | Whether to reject deprecated XVIZ chunk type numbers; `false` keeps compatibility. |

Remarks:

- Parses GLB v2 encoded data.
- Parses draft GLB v3 encoded data, including 64-bit file/chunk lengths and multiple binary chunks.
- Parses GLB v1 encoded data (enabling support for the glTF v1 `KHR_binary_gltf` extension).
- Extracts multiple binary chunks if present, even though the glTF specification normally uses one.

## Data Format

Returns

```typescript
{
  "header": {
    "byteLength": number,
    "byteOffset": number
  },

  "type": string,
  "version": number,

  // JSON Chunk
  "json": any,

  // BIN Chunk
  "hasBinChunk": boolean,
  "binChunks": [
    {
      "arrayBuffer": ArrayBuffer,
      "byteOffset": Number,
      "byteLength": Number
    }
  ]
}
```

| Field                       | Type          | Default | Description                                          |
| --------------------------- | ------------- | ------- | ---------------------------------------------------- |
| `type`                      | `String`      | `glTF`  | String containing the first four bytes of the file   |
| `version`                   | `Number`      | `2`     | The GLB version number                               |
| `json`                      | `Object`      | `{}`    | Parsed JSON from the JSON chunk                      |
| `binChunks`                 | `ArrayBuffer` | `null`  | The binary chunk                                     |
| `binChunks[\*].arrayBuffer` | `ArrayBuffer` | `null`  | The binary chunk                                     |
| `binChunks[\*].byteOffset`  | `Number`      | `null`  | offset of BIN (e.g. embedded in larger binary block) |
| `binChunks[\*].byteLength`  | `ArrayBuffer` | `null`  | length of BIN (e.g. embedded in larger binary block) |
| `header.byteLength`         | `Number`      | -       | length of GLB (e.g. embedded in larger binary block) |
| `header.byteOffset`         | `Number`      | 0       | offset of GLB (e.g. embedded in larger binary block) |
