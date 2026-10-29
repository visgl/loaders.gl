GLB loader

![](/next/images/format-logos/gltf-logo.svg)GLB

# Open the binary envelope around a glTF asset.

`GLBLoader` parses the GLB container and returns its JSON and binary chunks. Use `GLTFLoader` when the goal is a complete glTF scenegraph; use this lower-level loader when the envelope itself is the data you need.

[glTF module](https://loaders.gl/next/docs/modules/scene/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf.md)[GLB format](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)[GLTFLoader](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-loader.md)

The GLB boundary

## Read one binary file. Expose its JSON and byte ranges.

GLB packages a JSON chunk and one or more binary chunks into a single file. The loader preserves chunk offsets and lengths so higher-level code can decide how to interpret them.

01

Input

\`.glb\` binary data

02

Envelope

Header, version, and chunk lengths

03

JSON

Parsed glTF or application JSON

04

Binary

One or more ArrayBuffer chunks

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

The `GLBLoader` parses a GLB binary "envelope" extracting the embedded JSON and binary chunks.

Choose the layer

* Use `GLTFLoader` when the binary envelope contains a glTF scene and linked resources should be resolved for you.
* Use `GLBLoader` when an application needs to inspect, preserve, or reinterpret the JSON and binary chunks directly.

| Input              | Output                                                      | APIs                         |
| ------------------ | ----------------------------------------------------------- | ---------------------------- |
| `.glb` binary data | Header metadata, parsed JSON, and one or more binary chunks | `load`, `parse`, `parseSync` |

The loader reads GLB v1 and v2 files, plus the draft GLB v3 chunk layout. GLB v1 is returned in the standard `GLB` shape with `version: 1`; it is not silently presented as a v2 file.

## Usage[​](#usage "Direct link to Usage")

Detailed guide

## Container and data-shape details

The reference below covers supported GLB versions, options, parsed output fields, chunk offsets, and the distinction from GLTFLoader.

```
import {load} from '@loaders.gl/core';

import {GLBLoader} from '@loaders.gl/scene/gltf';

const gltf = await load(url, GLBLoader);
```

## Options[​](#options "Direct link to Options")

| Option                    | Type    | Default | Description                                                                        |
| ------------------------- | ------- | ------- | ---------------------------------------------------------------------------------- |
| `glb.strict` (DEPRECATED) | Boolean | `false` | Whether to reject deprecated XVIZ chunk type numbers; `false` keeps compatibility. |

Remarks:

* Parses GLB v2 encoded data.
* Parses draft GLB v3 encoded data, including 64-bit file/chunk lengths and multiple binary chunks.
* Parses GLB v1 encoded data (enabling support for the glTF v1 `KHR_binary_gltf` extension).
* Extracts multiple binary chunks if present, even though the glTF specification normally uses one.

## Data Format[​](#data-format "Direct link to Data Format")

Returns

```
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
