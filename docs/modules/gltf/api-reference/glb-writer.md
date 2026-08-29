---
title: GLBWriter
description: Pack JSON and binary chunks into a GLB envelope.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GLB writer"
  title="Pack application data into one binary envelope."
  description="`GLBWriter` writes the GLB container around JSON and binary chunks. Use `GLTFWriter` when the input is a scenegraph and the writer should perform glTF-specific assembly; use this writer for direct envelope control."
  tone="mint"
  meta={['GLB v2', 'JSON and BIN chunks', 'Synchronous and async encode']}
  links={[
    {label: 'glTF module', to: '/docs/modules/gltf'},
    {label: 'GLB format', to: '/docs/modules/gltf/formats/glb'},
    {label: 'GLTFWriter', to: '/docs/modules/gltf/api-reference/gltf-writer'}
  ]}
/>

<DocOrientation
  eyebrow="The GLB writing boundary"
  title="Start with JSON and bytes. Produce one portable file."
  description="The writer owns container headers, chunk alignment, and binary packing. It does not attempt to turn arbitrary data into a complete glTF scenegraph."
  tone="mint"
  items={[
    {label: 'Input', value: 'GLB-compatible JSON and binary data'},
    {label: 'Packing', value: 'JSON chunk plus optional BIN chunks'},
    {label: 'Version', value: 'GLB v2 output'},
    {label: 'Output', value: 'One encoded ArrayBuffer'}
  ]}
/>

<ReferenceBoundary
  title="Writer and envelope details"
  description="The reference below covers usage, supported APIs, output shape, version limits, and when GLTFWriter is the better entry point."
  tone="mint"
/>

The `GLBWriter` is a writer for the GLB binary "envelope" format.

Note: applications that want to encode GLB-formatted glTF files should normally use the `GLTFWriter` instead. The `GLBWriter` enables applications to save custom data that combines JSON and binary resources.

| Loader          | Characteristic                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| File Extensions | `.glb`                                                                                                     |
| File Type       | Binary                                                                                                     |
| Data Format     | See below                                                                                                  |
| File Format     | [GLB v2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Supported APIs  | `encode`, `encodeSync`                                                                                     |

## Usage

```typescript
import {GLBWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLBWriter, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    | N/A  | N/A     | N/A         |

## Data Format

See [`GLBLoader`](/docs/modules/gltf/api-reference/glb-loader).

## Remarks

- While the `GLBLoader` supports reading both GLB v1 and v2, only GLB v2 can be written.
