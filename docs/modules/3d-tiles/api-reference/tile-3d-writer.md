---
title: Tiles3DWriter
description: Current status and intended boundary for writing 3D Tiles content from loaders.gl data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles API / writer"
  title="Writing is a separate format boundary."
  description="Tiles3DWriter is reserved for a future writer path. This page makes the current status explicit and points to the supported readers, converters, and lower-level writers available today."
  tone="orange"
  meta={['Not implemented', 'Reader support available', 'Conversion path available']}
  links={[
    {label: '3D Tiles module', to: '/docs/modules/3d-tiles'},
    {label: 'Tiles3DLoader', to: '/docs/modules/3d-tiles/api-reference/tiles-3d-loader'},
    {label: 'Tile converter', to: '/docs/modules/tile-converter'}
  ]}
/>

<DocOrientation
  eyebrow="Current boundary"
  title="Use the supported path for now."
  description="loaders.gl can load and traverse 3D Tiles, and the tile converter can translate between I3S and 3D Tiles. A general-purpose Tiles3DWriter is not currently exposed."
  tone="orange"
  items={[
    {label: 'Read', value: 'Use Tiles3DLoader and Tiles3DSource for existing datasets.'},
    {label: 'Convert', value: 'Use tile-converter for I3S ↔ 3D Tiles preparation workflows.'},
    {label: 'Write content', value: 'Use glTF, Draco, or other supported payload writers where applicable.'},
    {label: 'Status', value: 'No public Tiles3DWriter implementation is available yet.'}
  ]}
/>

<ReferenceBoundary
  title="Writer status and adjacent APIs"
  description="This page remains intentionally short until a writer contract exists; the links above point to the reader and conversion APIs that are currently supported."
  tone="orange"
/>

`Tiles3DWriter` is not currently implemented. There is no public `encode()` or
`encodeURLtoURL()` path for producing a complete 3D Tiles tileset from loaders.gl data.

For content-writing workflows, write the payload format separately—for example with
[`GLTFWriter`](/docs/modules/gltf/api-reference/gltf-writer) or [`DracoWriter`](/docs/modules/draco/api-reference/draco-writer)—then assemble and publish the
tileset with a format-specific toolchain.
