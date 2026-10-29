WKT module · CRS writer

![](/next/images/format-logos/ogc-mark.svg)OGCWKT

# WKTCRSWriter

Encode a value-preserving WKTCRS AST as WKT coordinate reference system syntax, with compact or pretty output at the serialization boundary.

[WKT-CRS format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)[WKTCRSLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-loader.md)

What it writes

## Serialize CRS definitions without losing their shape.

WKTCRSWriter normalizes insignificant whitespace while retaining keyword spelling, delimiters, ordering, repeated and unknown nodes, and original number lexemes.

01

Input

A WKTCRSAst from @math.gl/geospatial/crs

02

Output

Compact or pretty WKT-CRS text

03

Preserves

Structure, ordering, and numeric lexemes

04

Boundary

Serialization, not coordinate transformation

Detailed guide

## WKTCRSWriter reference

The sections below document installation, usage, formatting options, and the supported AST contract.

Encodes a `WKTCRSAst` from `@math.gl/geospatial/crs` as WKT. See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the shared type model and the distinction between syntax preservation and coordinate transformation.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/geospatial @math.gl/geospatial
```

## Usage[​](#usage "Direct link to Usage")

```
import {encodeText, parse} from '@loaders.gl/core';

import {WKTCRSLoader, WKTCRSWriter} from '@loaders.gl/geospatial/wkt';



const ast = await parse('GEOGCRS["WGS 84",ID["EPSG",4326]]', WKTCRSLoader);

const compactWKT = await encodeText(ast, WKTCRSWriter);
```

## Options[​](#options "Direct link to Options")

Pass math.gl encoder options under the writer namespace:

```
const prettyWKT = await encodeText(ast, WKTCRSWriter, {

  'wkt-crs': {format: 'pretty', indent: 2}

});
```

Compact output is the default. Encoding normalizes insignificant whitespace but retains keyword spelling, delimiter choice, value order, repeated or unknown nodes, and number lexemes.

The writer accepts the v5 `WKTCRSAst`; it no longer accepts the v4 nested-array/hybrid-object shape or the `raw:` string convention.
