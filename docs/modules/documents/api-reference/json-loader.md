# JSONLoader

The documents `JSONLoader` parses one ordinary JSON document into its JavaScript value. Objects,
arrays, strings, numbers, booleans, and null remain those values. It does not extract rows, infer
schemas, create Arrow tables, or stream batches.

```typescript
import {parse} from '@loaders.gl/core';
import {JSONLoader} from '@loaders.gl/documents';

const value = await parse('{"settings":{"enabled":true}}', JSONLoader);
```

The root loader is metadata-only. Async APIs preload the native parser automatically. For sync use:

```typescript
import {parseSync} from '@loaders.gl/core';
import {JSONLoaderWithParser} from '@loaders.gl/documents/json-loader';

const value = parseSync('[1,2,3]', JSONLoaderWithParser);
```

| Property | Value |
| --- | --- |
| Extensions | `.json` |
| MIME type | `application/json` |
| Input | Text or UTF-8 bytes; a leading BOM is accepted |
| Output | Any JSON value (`unknown` in TypeScript) |
| Parser | Native `JSON.parse`, without third-party dependencies |
| Options | No document-specific options |
| Workers / streaming | None |

Invalid JSON throws a `SyntaxError`. Objects containing prototype-shaped keys retain normal
`JSON.parse` behavior; the loader does not assign those keys onto another object.

For JSON paths, streaming arrays, or row-table output, use the JSON loaders in
[`@loaders.gl/tables/json`](/docs/modules/tables/json). The minimal core JSON loader remains independent;
core does not depend on documents or tables.
