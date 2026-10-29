GLB writer

![](/next/images/format-logos/gltf-logo.svg)GLB

# Pack application data into one binary envelope.

`GLBWriter` writes the GLB container around JSON and binary chunks. Use `GLTFWriter` when the input is a scenegraph and the writer should perform glTF-specific assembly; use this writer for direct envelope control.

[glTF module](https://loaders.gl/next/docs/modules/scene/gltf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf.md)[GLB format](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)[GLTFWriter](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-writer.md)

The GLB writing boundary

## Start with JSON and bytes. Produce one portable file.

The writer owns container headers, chunk alignment, and binary packing. It does not attempt to turn arbitrary data into a complete glTF scenegraph.

01

Input

GLB-compatible JSON and binary data

02

Packing

JSON chunk plus optional BIN chunks

03

Version

GLB v2 output

04

Output

One encoded ArrayBuffer

Detailed guide

## Writer and envelope details

The reference below covers usage, supported APIs, output shape, version limits, and when GLTFWriter is the better entry point.

The `GLBWriter` is a writer for the GLB binary "envelope" format.

Note: applications that want to encode GLB-formatted glTF files should normally use the `GLTFWriter` instead. The `GLBWriter` enables applications to save custom data that combines JSON and binary resources.

| GLBWriter       |                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                                     |
| File Type       | Binary                                                                                                     |
| Data Format     | See below                                                                                                  |
| File Format     | [GLB v2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Supported APIs  | `encode`, `encodeSync`                                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {GLBWriter} from '@loaders.gl/scene/gltf';

import {encodeSync} from '@loaders.gl/core';



const arrayBuffer = encodeSync(gltf, GLBWriter, options);
```

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    | N/A  | N/A     | N/A         |

## Data Format[​](#data-format "Direct link to Data Format")

See [`GLBLoader`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/glb-loader.md).

## Remarks[​](#remarks "Direct link to Remarks")

* While the `GLBLoader` supports reading both GLB v1 and v2, only GLB v2 can be written.
