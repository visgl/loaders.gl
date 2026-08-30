---
title: WKTCRSWriter
description: Encode value-preserving CRS syntax trees as WKT coordinate reference systems.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · CRS writer"
  title="WKTCRSWriter"
  description="Encode a value-preserving WKTCRS AST as WKT coordinate reference system syntax, with compact or pretty output at the serialization boundary."
  tone="violet"
  meta={['From v4.0', 'WKT-CRS', 'Syntax-preserving output']}
  links={[
    {label: 'WKT-CRS format', to: '/docs/modules/wkt/formats/wkt-crs'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'WKTCRSLoader', to: '/docs/modules/wkt/api-reference/wkt-crs-loader'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Serialize CRS definitions without losing their shape."
  description="WKTCRSWriter normalizes insignificant whitespace while retaining keyword spelling, delimiters, ordering, repeated and unknown nodes, and original number lexemes."
  tone="violet"
  items={[
    {label: 'Input', value: 'A WKTCRSAst from @math.gl/crs'},
    {label: 'Output', value: 'Compact or pretty WKT-CRS text'},
    {label: 'Preserves', value: 'Structure, ordering, and numeric lexemes'},
    {label: 'Boundary', value: 'Serialization, not coordinate transformation'}
  ]}
/>

<ReferenceBoundary
  title="WKTCRSWriter reference"
  description="The sections below document installation, usage, formatting options, and the supported AST contract."
  tone="violet"
/>

Encodes a `WKTCRSAst` from `@math.gl/crs` as WKT. See
[Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the shared
type model and the distinction between syntax preservation and coordinate transformation.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/wkt @math.gl/crs
```

## Usage

```ts
import {encodeText, parse} from '@loaders.gl/core';
import {WKTCRSLoader, WKTCRSWriter} from '@loaders.gl/wkt';

const ast = await parse('GEOGCRS["WGS 84",ID["EPSG",4326]]', WKTCRSLoader);
const compactWKT = await encodeText(ast, WKTCRSWriter);
```

## Options

Pass math.gl encoder options under the writer namespace:

```ts
const prettyWKT = await encodeText(ast, WKTCRSWriter, {
  'wkt-crs': {format: 'pretty', indent: 2}
});
```

Compact output is the default. Encoding normalizes insignificant whitespace but retains keyword
spelling, delimiter choice, value order, repeated or unknown nodes, and number lexemes.

The writer accepts the v5 `WKTCRSAst`; it no longer accepts the v4 nested-array/hybrid-object
shape or the `raw:` string convention.
