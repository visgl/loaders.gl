---
title: Crunch texture format
description: Read legacy Crunch compressed texture payloads and expose their mip levels for GPU-oriented workflows.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {TextureTranscodeGraphic} from '@site/src/components/docs/texture-transcode-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Legacy compressed texture"
  title="Keep an older compressed texture path understandable."
  description="Crunch reduces distribution size for BC/DXT-style texture assets. It remains useful for existing pipelines, while newer web workflows generally prefer Basis Universal in KTX2 for broader GPU portability."
  tone="pink"
  meta={['CRN payloads', 'BC / DXT workflows', 'Legacy compatibility']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'CrunchWorkerLoader', to: '/docs/modules/textures/api-reference/crunch-loader'},
    {label: 'Basis and KTX2', to: '/docs/modules/textures/formats/basis'}
  ]}
/>

<TexturesDocsTabs active="crunch" />

<TextureTranscodeGraphic />

<DocOrientation
  eyebrow="Distribution and decode"
  title="Preserve compact assets while the pipeline transitions."
  description="Crunch is a delivery encoding rather than a final rendering policy. The loader exposes compressed levels and metadata so an existing runtime can continue to consume the asset or migrate it to a newer container."
  tone="pink"
  items={[
    {label: 'Input', value: 'Crunch `.crn` compressed texture files.'},
    {label: 'Decode', value: 'Read mip levels and recognized texture format metadata.'},
    {label: 'Runtime', value: 'Use the worker loader path for browser-friendly decoding.'},
    {label: 'Migration', value: 'Prefer Basis Universal and KTX2 for new cross-device pipelines.'}
  ]}
/>

<ReferenceBoundary
  title="Crunch format and API details"
  description="The reference below covers CRN payloads, mip levels, worker loading, format metadata, and the relationship to modern Basis workflows."
  tone="pink"
/>

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader)_ - reads Crunch `.crn` textures

Crunch is a lossy texture compression format designed to reduce distribution size for GPU texture assets, especially BC / DXT-style texture data.

It is not just a generic image format. In practice, Crunch is used as an intermediate distribution format for textures that will be expanded or decoded for GPU-oriented use.

Crunch is typically not used for new texture pipelines. In modern workflows it has largely been replaced by Basis Universal, often carried in KTX2 containers, because that path is more portable across GPU format families and fits current web and realtime graphics tooling better.

## Why It Is Used

Crunch is commonly used when a pipeline wants:

- smaller downloadable texture assets
- mipmapped texture distribution
- compatibility with DXT-family texture workflows

## loaders.gl Support

| Format Feature               | loaders.gl Support | Notes                                                                                    |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `.crn` parsing               | ✅                 | Supported by [`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader). |
| Mip level extraction         | ✅                 | Returned as `TextureLevel[]`.                                                            |
| GPU texture metadata tagging | ✅                 | loaders.gl reports recognized texture format metadata on decoded levels.                 |
| Worker-based loading         | ✅                 | Exposed through the Crunch worker loader path.                                           |

## Related Pages

- [`Basis Universal`](/docs/modules/textures/formats/basis)
- [`KTX / KTX2`](/docs/modules/textures/formats/ktx)
- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader)
