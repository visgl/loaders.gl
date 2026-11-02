# MaterialXLoader

Loads MaterialX XML into a structural document tree. The native XML parser supports browsers and Node.js.

## Asynchronous loading

```typescript
import {load} from '@loaders.gl/core';
import {MaterialXLoader} from '@loaders.gl/scene';

const document = await load('material.mtlx', MaterialXLoader);
console.log(document.version, document.root.children);
```

The package root exports metadata only. Asynchronous core APIs load the parser through `preload()`.

## Direct parser access

```typescript
import {MaterialXLoaderWithParser} from '@loaders.gl/scene/materialx-loader';

const document = MaterialXLoaderWithParser.parseTextSync(
  '<materialx version="1.39"/>'
);
```

The parser-bearing loader provides asynchronous and synchronous methods for XML text and UTF-8 ArrayBuffers. Sync core parsing requires this parser-bearing export.

## Result

- `version: string`: authored MaterialX 1.x version.
- `root: MaterialXElement`: document root.
- Each element has `category: string`, `attributes: Record<string, string>`, and ordered `children: MaterialXElement[]`.

There are no format-specific loader options. Attributes retain string values; connections and includes remain unresolved. No external resources are fetched by the parser.

## Errors and limitations

Malformed XML, missing or invalid root/version, document types, entity declarations, and excessive nesting are rejected. Structural parsing does not provide MaterialX semantic validation, graph evaluation, library composition, or shader compilation.

See [MaterialX format](../formats/materialx.md).
