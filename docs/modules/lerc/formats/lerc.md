---
title: LERC - Limited Error Raster Compression
description: Store raster values with explicit per-pixel error bounds and fast decoding.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Raster compression format"
  title="Set the error budget instead of pretending every pixel is RGB."
  description="LERC is designed for analytical rasters: arbitrary numeric pixel types, masks, NoData values, and a caller-selected maximum error. It keeps decoded values useful for analysis while reducing storage and transfer cost."
  tone="mint"
  meta={['Analytical rasters', 'Bounded error', 'Fast encode/decode']}
  links={[
    {label: 'LERC module', to: '/docs/modules/lerc'},
    {label: 'LERC loader', to: '/docs/modules/lerc/api-reference/lerc-loader'},
    {label: 'WCS coverage services', to: '/docs/modules/wms/formats/wcs'}
  ]}
/>

<DocOrientation
  eyebrow="The LERC path"
  title="Choose the numeric type. Set the tolerance. Decode the raster."
  description="LERC is a value-oriented raster codec, not a display-only image format. The decoded result can retain masks, NoData information, and statistics for downstream analysis."
  tone="mint"
  items={[
    {label: 'Input', value: 'Raster bands with arbitrary numeric pixel types'},
    {label: 'Budget', value: 'Maximum permitted error per pixel'},
    {label: 'Encode', value: 'Compact blocks with masks and NoData handling'},
    {label: 'Output', value: 'Typed pixels suitable for analysis or visualization'}
  ]}
/>

- _[`loaders.gl/wms`](/docs/modules/wms)_
- _[LERC specification](http://esri.github.io/lerc/)_

LERC is an open-source image or raster format which supports rapid encoding and decoding for any pixel type (not just RGB or Byte). Users set the maximum compression error per pixel while encoding, so the precision of the original input image is preserved (within user defined error bounds).

<ReferenceBoundary
  title="LERC encoding and raster details"
  description="The reference below covers value types, error bounds, masks, NoData handling, the loaders.gl entry points, and service integration."
  tone="mint"
/>
