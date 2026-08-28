# WKTCRSLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

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
