---
title: LERC
description: Decode limited error raster compression through the LERC loader.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="LERC module"
  title="Decode compact raster values with bounded error."
  description="`@loaders.gl/lerc` exposes LERC decoding for raster and imagery pipelines. It keeps the compressed payload at the edge and returns typed numeric data for the application or a higher-level loader."
  tone="cyan"
  meta={['LERC', 'Raster data', 'WASM-backed decoder']}
  links={[
    {label: 'LERC loader', to: '/docs/modules/lerc/api-reference/lerc-loader'},
    {label: 'LERC format', to: '/docs/modules/lerc/formats/lerc'},
    {label: 'Image and raster data', to: '/docs/modules/images'}
  ]}
/>

<DocOrientation
  eyebrow="The LERC path"
  title="Read compressed raster data. Return typed values."
  description="LERC is commonly used inside geospatial imagery workflows. The module provides the codec boundary while image and service loaders handle the surrounding metadata and transport."
  tone="cyan"
  items={[
    {label: 'Input', value: 'LERC-compressed raster payload'},
    {label: 'Decoder', value: 'WASM-backed LERC implementation'},
    {label: 'Output', value: 'Typed raster values and dimensions'},
    {label: 'Consumers', value: 'Image, GeoTIFF, and service pipelines'}
  ]}
/>

<ReferenceBoundary
  title="Codec details"
  description="The reference below covers installation, the loader API, the LERC format, WASM delivery, and integration with raster workflows."
  tone="cyan"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>
