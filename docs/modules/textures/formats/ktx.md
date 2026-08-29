---
title: KTX and KTX2 formats
description: Khronos texture containers for mipmapped, array, cube, and GPU-compressed texture data.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GPU texture container"
  title="Keep the texture layout with the payload."
  description="KTX and KTX2 package the metadata needed to interpret texture levels, arrays, cube maps, and compressed GPU data. KTX2 also provides a standard home for Basis Universal payloads."
  tone="cyan"
  meta={['KTX / KTX2', 'Mip chains', 'GPU format metadata']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Compressed texture loader', to: '/docs/modules/textures/api-reference/compressed-texture-loader'}
  ]}
/>

<TexturesDocsTabs active="ktx" />

<DocOrientation
  eyebrow="Container responsibilities"
  title="Describe how the GPU should read the bytes."
  description="KTX containers carry dimensions, levels, layers, faces, and format information alongside the image payload. The loader exposes that structure instead of reducing it to one ordinary image."
  tone="cyan"
  items={[
    {label: 'Layouts', value: '2D, 3D, array, and cube texture images'},
    {label: 'Levels', value: 'Mip chains with dimensions and byte sizes'},
    {label: 'Payloads', value: 'Native compressed blocks or Basis supercompression'},
    {label: 'Runtime', value: 'Texture metadata for WebGL, WebGPU, or another renderer'}
  ]}
/>

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)_ - reads KTX and KTX2 containers
- _[`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)_ - decodes Basis-compressed payloads commonly stored in KTX2

KTX is the Khronos texture container format for GPU textures. It is designed to store texture metadata and one or more texture images in a layout that maps cleanly onto graphics APIs.

<ReferenceBoundary
  title="KTX structure and runtime support"
  description="The sections below compare KTX revisions, describe supported container features, and show the loaders.gl return shapes."
  tone="cyan"
/>

KTX2 is the newer revision of the container. In realtime graphics workflows it is commonly used either for directly stored GPU texture payloads or as a container for Basis Universal supercompressed textures.

## Why It Is Used

KTX containers are designed for texture data rather than conventional images:

- they can store mip chains
- they can store array, 3D, and cube texture layouts
- they preserve GPU-oriented format metadata
- they avoid re-encoding texture payloads at load time

## KTX vs KTX2

| Format | Status            | Notes                                                                                           |
| ------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| KTX2   | Newer revision    | Common in modern realtime pipelines, including use as a container for Basis Universal payloads. |
| KTX    | Original revision | Still a Khronos texture container, but less flexible than KTX2 for newer workflows.             |

## loaders.gl Support

| Format Feature         | loaders.gl Support | Notes                                                                                                                 |
| ---------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| KTX container parsing  | ✅                 | Supported by [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader).             |
| KTX2 container parsing | ✅                 | Supported by [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader).             |
| KTX2 Basis transcoding | ✅                 | Use [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader) when the KTX2 payload needs Basis transcoding. |
| Mip level extraction   | ✅                 | Returned as `TextureLevel[]` or `TextureLevel[][]` depending on loader.                                               |
| GPU format tagging     | ✅                 | loaders.gl maps known container formats to WebGL and canonical texture format identifiers.                            |

## Related Pages

- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`Basis Universal`](/docs/modules/textures/formats/basis)
- [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)
- [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)
