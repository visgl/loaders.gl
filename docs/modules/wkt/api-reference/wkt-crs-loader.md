---
title: WKTCRSLoader
description: Parse WKT coordinate reference system syntax into a value-preserving AST.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · CRS loader"
  title="WKTCRSLoader"
  description="Parse WKT coordinate reference system syntax into a value-preserving AST, keeping the source structure available for inspection and faithful re-encoding."
  tone="violet"
  meta={['From v4.0', 'WKT-CRS', 'Value-preserving AST']}
  links={[
    {label: 'WKT-CRS format', to: '/docs/modules/wkt/formats/wkt-crs'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'WKTCRSWriter', to: '/docs/modules/wkt/api-reference/wkt-crs-writer'}
  ]}
/>

<DocOrientation
  eyebrow="What it preserves"
  title="Read the CRS definition without flattening it."
  description="The AST retains keyword spelling, delimiters, value order, repeated and unknown nodes, and numeric lexemes so applications can inspect or re-encode the definition faithfully."
  tone="violet"
  items={[
    {label: 'Input', value: 'WKT1, WKT2, GDAL, or ESRI syntax'},
    {label: 'Output', value: 'A value-preserving WKTCRSAst'},
    {label: 'Validation', value: 'Optional profile and strict checks'},
    {label: 'Boundary', value: 'Syntax parsing, not coordinate reprojection'}
  ]}
/>

<ReferenceBoundary
  title="WKTCRSLoader reference"
  description="The sections below document installation, usage, AST structure, profiles, and compatibility behavior."
  tone="violet"
/>

Parses [WKT coordinate reference system syntax](../formats/wkt-crs) into the value-preserving
`WKTCRSAst` from `@math.gl/crs`. See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems)
for the shared type model, format support, and reprojection roadmap.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/wkt @math.gl/crs
```

## Usage

```ts
import {parse} from '@loaders.gl/core';
import {WKTCRSLoader} from '@loaders.gl/wkt';

const ast = await parse('GEOGCRS["WGS 84",ID["EPSG",4326]]', WKTCRSLoader);
console.log(ast.root.keyword); // GEOGCRS
```

The package-root loader is metadata-only and preloads the parser for asynchronous core APIs. Use
`@loaders.gl/wkt/bundled` when synchronous parsing is required.

## Result

The loader returns:

```ts
type WKTCRSAst = {
  type: 'wkt-crs';
  root: WKTCRSNode;
};
```

Each node retains its keyword spelling, bracket or parenthesis delimiter, and ordered values.
Values are discriminated nested nodes, quoted strings, number values with their original `raw`
lexeme, or unquoted enumerations. Repeated and unknown vendor nodes remain in order.

## Options

Pass math.gl parse options under the loader namespace:

```ts
const ast = await parse(text, WKTCRSLoader, {
  'wkt-crs': {profile: 'wkt2:2019', strict: true}
});
```

- `profile`: `'auto'`, `'wkt1'`, `'wkt2:2015'`, `'wkt2:2019'`, `'gdal'`, or `'esri'`
- `strict`: validate the selected profile and reject reported issues

The v4 `raw`, `sort`, `keywords`, and `debug` options were tied to the old hybrid result and have
been removed. The AST always preserves numeric lexemes and source ordering.
