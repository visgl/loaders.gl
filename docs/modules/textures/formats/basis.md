---
title: Basis Universal format
description: A portable supercompressed texture payload that can be transcoded for the current GPU.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Portable texture payload"
  title="Ship one compressed asset. Transcode at the edge."
  description="Basis Universal keeps distribution compact and postpones the final texture choice until the runtime knows which GPU formats the device supports. It can travel as a standalone Basis file or inside KTX2."
  tone="cyan"
  meta={['Basis / KTX2', 'Runtime transcoding', 'Mip and image aware']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<TexturesDocsTabs active="basis" />

<DocOrientation
  eyebrow="The delivery tradeoff"
  title="Separate distribution format from device format."
  description="A Basis payload is optimized for transport. At load time, the transcoder selects a compressed or fallback representation that the current rendering device can use."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Raw .basis files or Basis payloads in .ktx2'},
    {label: 'Runtime choice', value: 'Target selected from device texture capabilities'},
    {label: 'Preserves', value: 'Images, mip levels, dimensions, and texture metadata'},
    {label: 'Output', value: 'TextureLevel data ready for the rendering layer'}
  ]}
/>

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)_ - decodes Basis Universal textures

Basis Universal is a supercompressed texture format designed to be transcoded efficiently into GPU-native compressed texture formats at load time.

<ReferenceBoundary
  title="Basis format and transcoding details"
  description="The sections below document containers, runtime selection, returned levels, and loaders.gl compatibility."
  tone="cyan"
/>

Rather than shipping one texture asset per target GPU family, applications can distribute Basis-compressed data and transcode it on the client into a supported runtime format.

## Why It Is Used

Basis Universal is useful when an application needs:

- smaller portable texture distribution assets
- one source asset for multiple GPU format families
- runtime selection of the best supported target texture format

Basis data may appear as:

- raw `.basis` files
- Basis payloads stored inside `.ktx2` containers

## loaders.gl Support

| Format Feature                               | loaders.gl Support | Notes                                                                                   |
| -------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| Raw `.basis` input                           | Yes                | Supported by [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader).        |
| Basis payloads in KTX2                       | Yes                | Supported by [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader).        |
| Runtime transcoding                          | Yes                | Transcodes into compressed or fallback uncompressed target formats.                     |
| Automatic format selection                   | Yes                | `basis.format: 'auto'` and `basis.supportedTextureFormats` help select a target format. |
| Preservation of multiple images / mip levels | Yes                | Returned as `TextureLevel[][]`.                                                         |

## Related Pages

- [`KTX / KTX2`](/docs/modules/textures/formats/ktx)
- [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)
- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
