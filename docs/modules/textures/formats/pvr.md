---
title: PVR texture format
description: Read PowerVR texture containers with mipmaps and GPU-oriented compressed payload metadata.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture format"
  title="Keep mobile texture payloads and mip levels together."
  description="PVR is a PowerVR-oriented texture container that packages compressed payloads, mipmaps, and texture metadata. loaders.gl exposes those levels in a common texture representation for a GPU runtime to consume."
  tone="violet"
  meta={['PVR container', 'PVRTC metadata', 'Mipmapped textures']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'CompressedTextureLoader', to: '/docs/modules/textures/api-reference/compressed-texture-loader'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<TexturesDocsTabs active="pvr" />

<DocOrientation
  eyebrow="GPU texture path"
  title="Decode the container, choose the runtime format later."
  description="The loader preserves mip levels and canonical format metadata while leaving device-specific upload and fallback decisions to the consuming application or graphics framework."
  tone="violet"
  items={[
    {label: 'Container', value: 'PVR headers, dimensions, levels, and compressed payloads.'},
    {label: 'Decode', value: 'Read each mip level as TextureLevel data.'},
    {label: 'Describe', value: 'Map recognized formats to canonical texture identifiers.'},
    {label: 'Upload', value: 'Hand levels to the GPU-oriented texture runtime.'}
  ]}
/>

<ReferenceBoundary
  title="PVR format and API details"
  description="The reference below covers the PVR container, mip levels, format tagging, and the shared compressed-texture loader path."
  tone="violet"
/>

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)_ - reads PVR containers

PVR is the PowerVR texture container format. It is associated with Imagination Technologies' PowerVR ecosystem and is commonly seen in mobile texture workflows.

The container can store compressed texture payloads together with mipmaps and texture metadata.

## Why It Is Used

PVR is commonly encountered in:

- PowerVR-oriented mobile pipelines
- PVRTC texture workflows
- offline-generated mipmapped texture assets

## loaders.gl Support

| Format Feature                   | loaders.gl Support | Notes                                                                                                     |
| -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| PVR container parsing            | Yes                | Supported by [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader). |
| Mip level extraction             | Yes                | Returned as `TextureLevel[]`.                                                                             |
| PVRTC and related format tagging | Yes                | loaders.gl maps recognized formats to canonical texture format identifiers.                               |
| Direct GPU upload workflows      | Yes                | Output is designed for GPU upload by consuming frameworks and applications.                               |

## Related Pages

- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)
