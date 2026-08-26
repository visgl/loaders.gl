# WKTCRSWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

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
