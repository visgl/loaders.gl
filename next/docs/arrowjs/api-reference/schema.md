Arrow JS API · schema

# Make the table’s contract explicit.

Schema is the ordered description of an Arrow table, record batch, or record. It names each field, declares its DataType and nullability, and carries metadata that should survive serialization.

[Field](https://loaders.gl/next/docs/arrowjs/api-reference/field.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/field.md)[Data types](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

The Schema model

## Describe columns before moving their values.

A schema lets readers, writers, builders, and applications agree on names and types independently of the physical batches that carry the values.

01

Fields

Ordered Field descriptors for each column

02

Types

Primitive, nested, temporal, and dictionary types

03

Nullability

Whether a field may contain null values

04

Metadata

String key/value annotations and dictionaries

Detailed guide

## Schema reference

The sections below document construction, fields, metadata, dictionaries, selection, assignment, and schema compatibility.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

Sequence of arrow `Field` objects describing columns in a table, batch, or record.

## Usage[​](#usage "Direct link to Usage")

```
import {Schema, Field, Int32, Utf8} from 'apache-arrow';



const schema = new Schema([

  new Field('id', new Int32(), false),

  new Field('name', new Utf8(), true)

]);



const selected = schema.select(['id']);

console.log(selected.names, schema.names.length);
```

```
import {Schema, Field, Int32, Float64} from 'apache-arrow';



const first = new Schema([new Field('a', new Int32())]);

const merged = first.assign(new Schema([new Field('b', new Float64())]));

console.log(merged.names);
```

## Members[​](#members "Direct link to Members")

### `fields: Field[]`[​](#fields-field "Direct link to fields-field")

Ordered field list for the schema.

### `metadata: Map<string, string>`[​](#metadata-mapstring-string "Direct link to metadata-mapstring-string")

Optional schema-level metadata.

### `dictionaries: Map<number, DataType>`[​](#dictionaries-mapnumber-datatype "Direct link to dictionaries-mapnumber-datatype")

Dictionary id to dictionary type map extracted from nested dictionary fields.

### `metadataVersion: MetadataVersion`[​](#metadataversion-metadataversion "Direct link to metadataversion-metadataversion")

Schema metadata serialization version.

### `names: (keyof T)[]`[​](#names-keyof-t "Direct link to names-keyof-t")

Column names in schema order.

## Methods[​](#methods "Direct link to Methods")

### `constructor(fields: Field<T[keyof T]>[] = [], metadata: Map<string, string> | null = null, dictionaries: Map<number, DataType> | null = null, metadataVersion: MetadataVersion = MetadataVersion.V4)`[​](#constructorfields-fieldtkeyof-t---metadata-mapstring-string--null--null-dictionaries-mapnumber-datatype--null--null-metadataversion-metadataversion--metadataversionv4 "Direct link to constructorfields-fieldtkeyof-t---metadata-mapstring-string--null--null-dictionaries-mapnumber-datatype--null--null-metadataversion-metadataversion--metadataversionv4")

Constructs a schema from fields and optional metadata.

### `select<K extends keyof T = any>(fieldNames: K[]): Schema<{ [P in K]: T[P] }>`[​](#selectk-extends-keyof-t--anyfieldnames-k-schema-p-in-k-tp- "Direct link to selectk-extends-keyof-t--anyfieldnames-k-schema-p-in-k-tp-")

Returns a new schema containing only selected field names.

### `selectAt<K extends T = any>(fieldIndices: number[]): Schema<K>`[​](#selectatk-extends-t--anyfieldindices-number-schemak "Direct link to selectatk-extends-t--anyfieldindices-number-schemak")

Returns a new schema containing fields at selected indices.

### `assign<R extends TypeMap = any>(schema: Schema<R>): Schema<T & R>`[​](#assignr-extends-typemap--anyschema-schemar-schemat--r "Direct link to assignr-extends-typemap--anyschema-schemar-schemat--r")

### `assign<R extends TypeMap = any>(...fields: (Field<R[keyof R]> | Field<R[keyof R]>[])[]): Schema<T & R>`[​](#assignr-extends-typemap--anyfields-fieldrkeyof-r--fieldrkeyof-r-schemat--r "Direct link to assignr-extends-typemap--anyfields-fieldrkeyof-r--fieldrkeyof-r-schemat--r")

Merges this schema with another schema or one or more fields and returns a new schema.

### `toString(): string`[​](#tostring-string "Direct link to tostring-string")

Returns a short schema preview.

### `[Symbol.toStringTag]: string`[​](#symboltostringtag-string "Direct link to symboltostringtag-string")

Returns `'Schema'`.
