---
title: TWKB - Tiny Well-Known Binary
description: Encode vector geometry compactly with delta coordinates and variable-length integers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geometry binary format"
  title="Smaller geometry records for constrained links."
  description="Tiny Well-Known Binary (TWKB) is a compact WKB variant that uses quantized coordinates, deltas, and variable-length integers to reduce the bytes needed for neighboring geometry points."
  tone="orange"
  meta={['WKB variant', 'Delta coordinates', 'Varint encoding']}
  links={[
    {label: 'WKT module', to: '/docs/modules/wkt'},
    {label: 'TWKBLoader', to: '/docs/modules/wkt/api-reference/twkb-loader'},
    {label: 'TWKBWriter', to: '/docs/modules/wkt/api-reference/twkb-writer'}
  ]}
/>

<DocOrientation
  eyebrow="The TWKB record path"
  title="Store the first position. Make nearby points inexpensive."
  description="TWKB is useful when geometry is spatially local and transport size matters. The decoder reconstructs the coordinate sequence from compact integer deltas before exposing the common geometry result."
  tone="orange"
  items={[
    {label: 'Coordinate model', value: 'Quantized integer coordinates and deltas'},
    {label: 'Encoding', value: 'Variable-length integers with zigzag values'},
    {label: 'Typical use', value: 'Compact vector geometry over APIs or mobile links'},
    {label: 'Related formats', value: 'WKB for general binary geometry; WKT for readable text'}
  ]}
/>

<ReferenceBoundary
  title="TWKB layout and support details"
  description="The reference below covers the compact encoding model, ecosystem support, and the loaders.gl APIs for reading and writing TWKB geometry."
  tone="orange"
/>

- _[`@loaders.gl/wkt`](/docs/modules/wkt)_
- _[TWKB specification](https://github.com/TWKB/Specification/blob/master/twkb.md)_

TWKB is a format for serializing vector geometry data into a binary byte buffer, similar to [WKB](./wkb) but with an emphasis on minimizing size of the buffer.

## Memory Layout

WKB uses IEEE doubles as the coordinate storage format, so for data with lots of spatially adjacent coordinates (typical for GIS data) it wastes precision, i.e. space on redundant coordinate information:

- TWKB only stores the absolute position once, and stores all other positions as delta values relative to the preceding position.
- TWKB Only use as much address space as is necessary for any given value. Practically this means that "variable length integers" or "varints" are used throughout the specification for storing values in any situation where numbers greater than 128 might be encountered.

## Ecosystem Support

- PostGIS offers a function to return geometries in TWKB format: [ST_AsTWKB](https://postgis.net/docs/ST_AsTWKB.html).

## Versions / History

Unknown.
