---
title: convertJSONToArrow
description: Convert application-built arrays and already-parsed JSON into native Apache Arrow tables.
---

# convertJSONToArrow

Turn rows that are already in memory into a native Apache Arrow `Table`, ready for Arrow-aware
visualization, column access, or registration with a query engine. There is no need to stringify
rows and feed them back through a JSON parser.

```typescript
import {convertJSONToArrow} from '@loaders.gl/tables/json-table-loader';

const rows = [
  {name: 'Oslo', population: 717710},
  {name: 'Bergen', population: 291940}
];
const table = convertJSONToArrow(rows);

console.log(table.numRows); // 2
console.log(table.getChild('name')?.get(0)); // 'Oslo'
```

Use this function for application-built arrays or JSON obtained through another library.
Use [`JSONTableLoader`](./json-table-loader.md) to parse JSON text, load files, or stream encoded
JSON. Both use the same row discovery, schema inference, and Arrow conversion policies.

## Import and signature

```typescript
import {
  convertJSONToArrow,
  type ConvertJSONToArrowOptions
} from '@loaders.gl/tables/json-table-loader';

const table = convertJSONToArrow(data, options);
```

- **`data: unknown`**: An already-parsed JSON value containing rows, or a loaders.gl row-table wrapper.
- **`options?: ConvertJSONToArrowOptions`**: Optional flat `schema`, `arrowConversion`, and `log` settings.
- **Returns**: A native `apache-arrow` `Table`, synchronously. No `await` is necessary.

The converter is exported from the parser subpath; it is not exported from the metadata-only
`@loaders.gl/tables` or `@loaders.gl/tables/json` roots. It creates Arrow columns without modifying
the source rows. Conversion runs on the calling thread and materializes the entire table.

## Supported input shapes

| Input | Interpretation |
| --- | --- |
| `[{name: 'Oslo'}, {name: 'Bergen'}]` | Object rows; keys become column names. |
| `[['Oslo', 717710], ['Bergen', 291940]]` | Array rows; inferred names are `column1`, `column2`, and so on. |
| `{result: {items: [{name: 'Oslo'}]}}` | The first nested array becomes the row array. |
| `{shape: 'object-row-table', data: [{name: 'Oslo'}]}` | An existing loaders.gl object-row table. |
| `{shape: 'array-row-table', data: [['Oslo', 717710]]}` | An existing loaders.gl array-row table. |

For a nested JSON document, discovery walks object values depth-first in property order and
stops at the first array, including an empty array. It does not search for a later, better-matching
array. When the document contains multiple arrays, select the intended rows explicitly:

```typescript
const response = await fetch('/api/cities');
if (!response.ok) throw new Error(`City request failed: ${response.status}`);
const payload = await response.json();
const table = convertJSONToArrow(payload.results.cities);
```

The input must be JSON-like, acyclic row data. JSON strings, binary buffers, responses, primitive
arrays such as `[1, 2]`, and objects without a row array are not row inputs. Use a loader to decode
encoded input first. Native Arrow tables and columnar-table wrappers are not input formats for
this converter.

## Schema inference and nested values

Without `schema`, the converter examines the rows and infers columns recursively. JSON numbers
become Float64, strings become Utf8, booleans become Bool, nested objects become Struct, and
nested arrays become List. Null values and absent fields contribute to inferred nullability.
Conflicting inferred types can throw; supply a schema and recovery policy when input is inconsistent.

```typescript
const table = convertJSONToArrow([
  {name: 'Oslo', location: {latitude: 59.91, longitude: 10.75}, scores: [3, 5]},
  {name: 'Bergen', location: {latitude: 60.39, longitude: 5.32}, scores: [4]}
]);

const location = table.getChild('location')?.get(0);
console.log(location.latitude); // 59.91
```

GeoJSON is treated as generic JSON. This function does not create GeoArrow geometry columns;
use [`GeoJSONLoader`](./geojson-loader.md) for GeoJSON-specific conversion.

A row-table wrapper does not pin the inferred field types. Pass `options.schema` to require a
specific schema; this matches `JSONTableLoader` behavior.

## Explicit schemas

Pass either a loaders.gl `Schema` or an Apache Arrow `Schema`. Explicit schemas control field
order, types, and nullability. For array rows, positions map to the supplied schema's field order.

```typescript
import {Field, Int32, Schema, Utf8} from 'apache-arrow';

const schema = new Schema([
  new Field('name', new Utf8(), false),
  new Field('population', new Int32(), false)
]);
const table = convertJSONToArrow([
  ['Oslo', 717710],
  ['Bergen', 291940]
], {schema});
```

The equivalent loaders.gl schema is:

```typescript
import type {Schema} from '@loaders.gl/core/schema';

const schema: Schema = {
  fields: [
    {name: 'name', type: 'utf8', nullable: false},
    {name: 'population', type: 'int32', nullable: false}
  ],
  metadata: {}
};
```

### Options

These options reuse the loader's conversion semantics, but are passed directly, without a `json`
namespace. Parser options such as `backend`, `jsonpaths`, and `shape` do not apply.

| Option | Default | Description |
| --- | --- | --- |
| `schema` | Inferred | Loaders.gl or Apache Arrow schema to convert against. |
| `arrowConversion` | Strict policies below | Controls mismatches and optional recovery. |
| `log` | None | Optional probe.gl-style logger with `once(message)()` or `warn(message)()` for recovery warnings. |

| `arrowConversion` property | Default | Values and behavior |
| --- | --- | --- |
| `onTypeMismatch` | `'error'` | `'error'` throws; `'null'` writes null when the field is nullable. |
| `onMissingField` | `'error'` | `'error'` throws; `'null'` writes null for missing nullable fields. Inferred schemas already accommodate absent nullable fields. |
| `onExtraField` | `'error'` | `'error'` throws; `'drop'` ignores fields or array columns outside the schema. |
| `integerConversion` | `'error'` | `'clamp-and-round'` rounds and clamps to the integer range; `'warn'` also logs; `'null'` writes null for nullable fields; `'error'` rejects incompatible numbers. |
| `utf8Conversion` | `'error'` | `'number-to-string'` permits numbers in Utf8 fields; `'error'` rejects them. |
| `viewTypes` | `'never'` | `'never'`, `'prefer'`, or `'require'` controls Arrow Utf8View/BinaryView use according to runtime support. |
| `logRecoveries` | `true` | Enables recovery warnings when a logger is provided; warnings are deduplicated by issue kind and field path within each conversion. |

### Recovering inconsistent rows

Recovery is explicit. Null recovery still requires nullable fields. Supplying a schema allows
values to be checked against known types instead of requiring incompatible types to be inferred.

```typescript
import {Field, Float64, Schema} from 'apache-arrow';

const schema = new Schema([new Field('temperature', new Float64(), true)]);
const table = convertJSONToArrow([
  {temperature: 18.5},
  {temperature: 'unavailable'},
  {unexpected: 'ignored'}
], {
  schema,
  arrowConversion: {
    onTypeMismatch: 'null',
    onMissingField: 'null',
    onExtraField: 'drop'
  }
});
// temperature column: [18.5, null, null]
```

## Using with deck.gl

For a deck.gl layer that accepts native Arrow tables, whole-dataset asynchronous loading can use
the converter directly as `dataTransform`:

```typescript
// Props for an Arrow-compatible layer; the layer's other props are application-specific.
const layerProps = {
  data: '/api/cities.json',
  dataTransform: convertJSONToArrow
};
```

The fetched value must already be parsed into rows by the layer's loading pipeline. The converter
does not fetch or parse JSON text itself. It also does not add Arrow support to a layer that only
accepts row objects or deck.gl binary attributes.

Use a callback when supplying conversion options:

```typescript
const layerProps = {
  data: '/api/cities.json',
  dataTransform: data => convertJSONToArrow(data, {schema})
};
```

For arrays built in your application, convert directly rather than relying on asynchronous loading:

```typescript
const layerProps = {
  data: convertJSONToArrow(rows)
};
```

**Streaming requires an adapter.** deck.gl calls streaming transforms with `(chunk, previousData)`;
the converter's second argument is an options object, not previous data. Do not pass this function
directly for async iterable data. A streaming adapter must explicitly manage accumulation and schema
consistency. This converter does not append to an existing Arrow table.

## Empty data and errors

- `[]` produces a zero-row, zero-column table without an explicit schema.
- `[]` with an explicit schema retains the declared columns with zero rows.
- `[{}, {}]` or `[[], []]` produces two rows with zero columns when the schema is inferred.
- Invalid top-level input throws an error identifying `convertJSONToArrow` and the expected row input.
- Schema inference and conversion failures throw synchronously using the shared JSON conversion
  diagnostics. Strict conversion is the default; no stringify/parse fallback is performed.

## Relationship to JSONTableLoader

`convertJSONToArrow(rows)` returns the native Arrow table itself: use `.schema`, `.numRows`, and
`.getChild()` directly. `JSONTableLoader` with `json.shape: 'arrow-table'` returns the loaders.gl
wrapper `{shape: 'arrow-table', schema, data}`, whose `.data` is the native Arrow table. The core
APIs also support the top-level `shape: 'arrow'` option for native Arrow output from encoded input.

Use the converter when your data is already parsed. Use the loader when you need decoding,
fetching, workers, or streamed JSON parsing. Conversion does not itself execute queries; pass the
result to your Arrow-aware query engine using that engine's table registration API.
