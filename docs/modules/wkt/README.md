---
title: WKT, WKB, and WKT-CRS
description: Parse and write geometry and coordinate reference systems in OGC text and binary forms.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT and WKB module"
  title="Keep geometry and coordinate systems interoperable."
  description="`@loaders.gl/wkt` handles OGC Well-Known Text, Well-Known Binary, and WKT coordinate reference systems. It provides loaders and writers for the syntax boundaries that appear across GIS formats."
  tone="orange"
  meta={['WKT and WKB', 'WKT-CRS', 'Loaders and writers']}
  links={[
    {label: 'WKT formats', to: '/docs/modules/wkt/formats/wkt'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'WKT APIs', to: '/docs/modules/wkt/api-reference/wkt-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The geometry syntax path"
  title="Parse text or bytes. Preserve the geometry meaning."
  description="Choose WKT for readable interchange, WKB for compact binary geometry, or WKT-CRS for spatial reference definitions. The same module also provides the corresponding writers."
  tone="orange"
  items={[
    {label: 'WKT', value: 'Readable geometry text'},
    {label: 'WKB', value: 'Compact binary geometry'},
    {label: 'WKT-CRS', value: 'Coordinate reference system syntax'},
    {label: 'Output', value: 'Geometry or CRS objects for GIS pipelines'}
  ]}
/>

<ReferenceBoundary
  title="Format and API details"
  description="The reference below covers supported syntaxes, loaders, writers, CRS handling, and the upstream implementations used by the module."
  tone="orange"
/>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for WKT
syntax handling, shared CRS types, and cross-format CRS support.

![ogc-logo](../../images/logos/ogc-logo-60.png)

## Formats

The `@loaders.gl/wkt` module handles the following formats:

| Format                                                                                       | Description                               |
| -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`Well Known Text (WKT)`](/docs/modules/wkt/formats/wkt)                                     | ASCII format for geometry features        |
| [`Well Known Binary (WKB)`](/docs/modules/wkt/formats/wkb)                                   | Binary format for geometry features       |
| [`Well Known Text Coordinate Reference System (WKT-CRS)`](/docs/modules/wkt/formats/wkt-crs) | Text format for spatial reference systems |

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`WKBLoader`](/docs/modules/wkt/api-reference/wkb-loader) | Parses Well-Known Binary geometry. |
| [`WKBWriter`](/docs/modules/wkt/api-reference/wkb-writer) | Writes geometry as Well-Known Binary. |
| [`WKTLoader`](/docs/modules/wkt/api-reference/wkt-loader) | Parses Well-Known Text geometry. |
| [`WKTWriter`](/docs/modules/wkt/api-reference/wkt-writer) | Writes geometry as Well-Known Text. |
| [`WKTCRSLoader`](/docs/modules/wkt/api-reference/wkt-crs-loader) | Parses Well-Known Text coordinate reference systems. |
| [`WKTCRSWriter`](/docs/modules/wkt/api-reference/wkt-crs-writer) | Writes coordinate reference systems as WKT-CRS. |

## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
The `WKBLoader` and `WKBWriter` are forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz.
The `WKTCRSLoader` and `WKTCRSWriter` are thin adapters over the dependency-free syntax codecs in
`@math.gl/crs`.
