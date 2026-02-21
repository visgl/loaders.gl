# Schema

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Sequence of arrow `Field` objects describing columns in a table, batch, or record.

## Usage

```ts
import {Schema, Field, Int32, Utf8} from 'apache-arrow';

const schema = new Schema([
  new Field('id', new Int32(), false),
  new Field('name', new Utf8(), true)
]);

const selected = schema.select(['id']);
console.log(selected.names, schema.names.length);
```

```ts
import {Schema, Field, Int32, Float64} from 'apache-arrow';

const first = new Schema([new Field('a', new Int32())]);
const merged = first.assign(new Schema([new Field('b', new Float64())]));
console.log(merged.names);
```

## Members

### `fields: Field[]`

Ordered field list for the schema.

### `metadata: Map<string, string>`

Optional schema-level metadata.

### `dictionaries: Map<number, DataType>`

Dictionary id to dictionary type map extracted from nested dictionary fields.

### `metadataVersion: MetadataVersion`

Schema metadata serialization version.

### `names: (keyof T)[]`

Column names in schema order.

## Methods

### `constructor(fields: Field<T[keyof T]>[] = [], metadata: Map<string, string> | null = null, dictionaries: Map<number, DataType> | null = null, metadataVersion: MetadataVersion = MetadataVersion.V4)`

Constructs a schema from fields and optional metadata.

### `select<K extends keyof T = any>(fieldNames: K[]): Schema<{ [P in K]: T[P] }>`

Returns a new schema containing only selected field names.

### `selectAt<K extends T = any>(fieldIndices: number[]): Schema<K>`

Returns a new schema containing fields at selected indices.

### `assign<R extends TypeMap = any>(schema: Schema<R>): Schema<T & R>`

### `assign<R extends TypeMap = any>(...fields: (Field<R[keyof R]> | Field<R[keyof R]>[])[]): Schema<T & R>`

Merges this schema with another schema or one or more fields and returns a new schema.

### `toString(): string`

Returns a short schema preview.

### `[Symbol.toStringTag]: string`

Returns `'Schema'`.
