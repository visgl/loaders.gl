---
title: WKTWriter
description: Encode loaders.gl geometry as readable OGC Well-Known Text.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry writer"
  title="WKTWriter"
  description="Encode structured geometry as readable Well-Known Text for inspection, interchange, logs, and systems that accept the OGC text representation."
  tone="orange"
  meta={['From v2.1', 'OGC WKT', 'Text output']}
  links={[
    {label: 'WKT format', to: '/docs/modules/wkt/formats/wkt'},
    {label: 'WKTLoader', to: '/docs/modules/wkt/api-reference/wkt-loader'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Make geometry readable at the interchange boundary."
  description="WKTWriter provides the text counterpart to WKTLoader, turning loaders.gl geometry into a standard syntax that remains easy to inspect and move between GIS tools."
  tone="orange"
  items={[
    {label: 'Input', value: 'Structured geometry objects'},
    {label: 'Output', value: 'Readable WKT text'},
    {label: 'Types', value: 'Common and extended geometry forms'},
    {label: 'APIs', value: 'encode and encodeSync'}
  ]}
/>

<ReferenceBoundary
  title="WKTWriter reference"
  description="The sections below document format metadata, installation, usage, options, and attribution."
  tone="orange"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Writer for the [Well-known text] format for representation of geometry.

| Loader         | Characteristic                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| File Extension | `.wkt`,                                                                                     |
| File Type      | Text                                                                                        |
| File Format    | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) |
| Data Format    | [Geometry](/docs/specifications/category-gis)                                               |
| Supported APIs | `encode`, `encodeSync`                                                                      |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {WKTWriter} from '@loaders.gl/wkt';
```

## Options

N/A

## Attribution

The `WKTWriter` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
