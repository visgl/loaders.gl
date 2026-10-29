WKT module · CRS loader

![](/next/images/format-logos/ogc-mark.svg)OGCWKT

# WKTCRSLoader

Parse WKT coordinate reference system syntax into a value-preserving AST, keeping the source structure available for inspection and faithful re-encoding.

[WKT-CRS format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)[WKTCRSWriter](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-writer.md)

What it preserves

## Read the CRS definition without flattening it.

The AST retains keyword spelling, delimiters, value order, repeated and unknown nodes, and numeric lexemes so applications can inspect or re-encode the definition faithfully.

01

Input

WKT1, WKT2, GDAL, or ESRI syntax

02

Output

A value-preserving WKTCRSAst

03

Validation

Optional profile and strict checks

04

Boundary

Syntax parsing, not coordinate reprojection

Detailed guide

## WKTCRSLoader reference

The sections below document installation, usage, AST structure, profiles, and compatibility behavior.

Parses [WKT coordinate reference system syntax](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md) into the value-preserving `WKTCRSAst` from `@math.gl/geospatial/crs`. See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the shared type model, format support, and reprojection roadmap.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/geospatial @math.gl/geospatial
```

## Usage[​](#usage "Direct link to Usage")

```
import {parse} from '@loaders.gl/core';

import {WKTCRSLoader} from '@loaders.gl/geospatial/wkt';



const ast = await parse('GEOGCRS["WGS 84",ID["EPSG",4326]]', WKTCRSLoader);

console.log(ast.root.keyword); // GEOGCRS
```

The package-root loader is metadata-only and preloads the parser for asynchronous core APIs. Use `@loaders.gl/geospatial/wkt/bundled` when synchronous parsing is required.

## Result[​](#result "Direct link to Result")

The loader returns:

```
type WKTCRSAst = {

  type: 'wkt-crs';

  root: WKTCRSNode;

};
```

Each node retains its keyword spelling, bracket or parenthesis delimiter, and ordered values. Values are discriminated nested nodes, quoted strings, number values with their original `raw` lexeme, or unquoted enumerations. Repeated and unknown vendor nodes remain in order.

## Options[​](#options "Direct link to Options")

Pass math.gl parse options under the loader namespace:

```
const ast = await parse(text, WKTCRSLoader, {

  'wkt-crs': {profile: 'wkt2:2019', strict: true}

});
```

* `profile`: `'auto'`, `'wkt1'`, `'wkt2:2015'`, `'wkt2:2019'`, `'gdal'`, or `'esri'`
* `strict`: validate the selected profile and reject reported issues

The v4 `raw`, `sort`, `keywords`, and `debug` options were tied to the old hybrid result and have been removed. The AST always preserves numeric lexemes and source ordering.
