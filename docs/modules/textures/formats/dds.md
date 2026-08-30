---
title: DDS texture format
description: Read DirectDraw Surface containers with compressed GPU texture payloads and mipmaps.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {TextureTranscodeGraphic} from '@site/src/components/docs/texture-transcode-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture container"
  title="Keep compressed desktop texture assets upload-ready."
  description="DDS packages compressed texture blocks, dimensions, and mipmaps in a container common to Direct3D-oriented pipelines. loaders.gl extracts the levels and canonical format metadata for the consuming GPU runtime."
  tone="blue"
  meta={['DDS container', 'BC / DXT families', 'Mipmapped payloads']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'CompressedTextureLoader', to: '/docs/modules/textures/api-reference/compressed-texture-loader'},
    {label: 'Compressed textures', to: '/docs/modules/textures/formats/compressed-textures'}
  ]}
/>

<TexturesDocsTabs active="dds" />

<TextureTranscodeGraphic />

<DocOrientation
  eyebrow="Compressed texture path"
  title="Read the levels without expanding them prematurely."
  description="DDS is useful when the runtime can consume the compressed blocks directly. The loader keeps the payload compressed and reports its layout so the application can choose upload or transcode behavior."
  tone="blue"
  items={[
    {label: 'Header', value: 'Dimensions, format flags, mip count, and array/cube metadata.'},
    {label: 'Payload', value: 'BC, DXT, and other recognized compressed texture blocks.'},
    {label: 'Levels', value: 'Return mip data as a shared TextureLevel representation.'},
    {label: 'Runtime', value: 'Upload directly or choose an application-specific fallback.'}
  ]}
/>

<ReferenceBoundary
  title="DDS format and API details"
  description="The reference below covers the container header, compressed formats, mip-level extraction, and GPU upload boundaries."
  tone="blue"
/>

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)_ - reads DDS containers

DDS, short for DirectDraw Surface, is a Microsoft texture container format widely used to store GPU texture data, especially in Direct3D-oriented pipelines.

Although the name comes from an older Microsoft graphics API, the format remains common in asset pipelines because it can store compressed texture payloads and mipmaps in a single file.

## Why It Is Used

DDS is often used for:

- precomputed mip chains
- BC / DXT-family compressed textures
- older desktop-oriented real-time rendering pipelines

## loaders.gl Support

| Format Feature                    | loaders.gl Support | Notes                                                                                                     |
| --------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| DDS container parsing             | Yes                | Supported by [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader). |
| Mip level extraction              | Yes                | Returned as `TextureLevel[]`.                                                                             |
| Common compressed texture formats | Yes                | loaders.gl maps known DDS texture formats to canonical texture format identifiers.                        |
| Direct GPU upload workflows       | Yes                | Output is designed for GPU upload by consuming frameworks and applications.                               |

## Related Pages

- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)
