---
title: TWKBLoader
description: Parse compact Tiny Well-Known Binary geometry into loaders.gl data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry loader"
  title="TWKBLoader"
  description="Parse Tiny Well-Known Binary geometry and expose it through the same application-facing geometry shape used by the WKT module."
  tone="orange"
  meta={['From v4.0', 'Compact binary', 'Synchronous parser']}
  links={[
    {label: 'TWKB format', to: '/docs/modules/wkt/formats/twkb'},
    {label: 'TWKBWriter', to: '/docs/modules/wkt/api-reference/twkb-writer'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Reconstruct geometry from compact integer records."
  description="TWKB reduces transport size by quantizing coordinates and storing neighboring positions as deltas. The loader handles that binary representation before returning structured geometry data."
  tone="orange"
  items={[
    {label: 'Input', value: 'Tiny Well-Known Binary bytes'},
    {label: 'Encoding', value: 'Quantized coordinates, deltas, and varints'},
    {label: 'Output', value: 'Structured geometry positions'},
    {label: 'APIs', value: 'load, parse, and parseSync'}
  ]}
/>

<ReferenceBoundary
  title="TWKBLoader reference"
  description="The sections below document installation, usage, the compact geometry encoding, and the current loader behavior."
  tone="orange"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

Loader for [Tiny Well-Known Binary](../formats/twkb), a compact geometry encoding distinct from WKB.

[twkb]: ../formats/twkb

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.twkb`                                       |
| File Type             | Binary                                        |
| File Format           | [Tiny Well Known Binary][twkb]                |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `load`, `parse`, `parseSync`                  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | ✅ Yes                                           |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {TWKBLoader} from '@loaders.gl/wkt/bundled';
import {parseSync} from '@loaders.gl/core';

// Precision zero, Point (1, 2), zigzag-encoded coordinates.
const buffer = new Uint8Array([1, 0, 2, 4]).buffer;
const data = parseSync(buffer, TWKBLoader);
// => {type: 'Point', coordinates: [1, 2]}
```

```typescript
import {TWKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, TWKBLoader);
```

## Options

N/A

## Format summary

TWKB stores quantized coordinates as variable-length integers, with deltas between
successive positions. Precision is encoded in the header. It does not store WKB's
double-precision coordinate records. See the [TWKB format page](../formats/twkb)
for supported geometry types and format boundaries.
