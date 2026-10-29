Arrow JS API · schema component

# A Field gives one column a name and a contract.

Field pairs a column name with its DataType, nullability, and optional metadata. Schemas use ordered fields to describe the columns in tables, record batches, and nested structures.

[Schema](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)[Data types](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

The Field model

## Give every column a stable meaning.

Fields are the small schema units that let Arrow readers, builders, and writers agree on how to interpret a column before values are accessed.

01

Name

The stable column identifier

02

Type

The logical Arrow DataType

03

Nullability

Whether null values are permitted

04

Metadata

Optional string annotations for consumers

Detailed guide

## Field reference

The sections below document members, constructors, Field.new, cloning, metadata, and type relationships.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

A `Field` is a named column component with type and nullability metadata.

## Usage[​](#usage "Direct link to Usage")

```
import {Field, Int32} from 'apache-arrow';



const id = Field.new({name: 'id', type: new Int32(), nullable: false});

const cloned = id.clone({nullable: true});
```

## Members[​](#members "Direct link to Members")

### `name: string`[​](#name-string "Direct link to name-string")

Field name.

### `type: DataType`[​](#type-datatype "Direct link to type-datatype")

Field data type.

### `nullable: boolean`[​](#nullable-boolean "Direct link to nullable-boolean")

Whether null values are permitted.

### `metadata: Map<string, string>`[​](#metadata-mapstring-string "Direct link to metadata-mapstring-string")

Optional field metadata.

### `typeId: Type`[​](#typeid-type "Direct link to typeid-type")

The underlying `DataType` identifier.

### `readonly [Symbol.toStringTag]: string`[​](#readonly-symboltostringtag-string "Direct link to readonly-symboltostringtag-string")

Debug name shown by `Object.prototype.toString`.

## Static methods[​](#static-methods "Direct link to Static methods")

### `Field.new<T extends DataType = any>(props: { name: string | number; type: T; nullable?: boolean; metadata?: Map<string, string> | null }): Field<T>`[​](#fieldnewt-extends-datatype--anyprops--name-string--number-type-t-nullable-boolean-metadata-mapstring-string--null--fieldt "Direct link to fieldnewt-extends-datatype--anyprops--name-string--number-type-t-nullable-boolean-metadata-mapstring-string--null--fieldt")

### `Field.new<T extends DataType = any>(name: string | number | Field<T>, type: T, nullable?: boolean, metadata?: Map<string, string> | null): Field<T>`[​](#fieldnewt-extends-datatype--anyname-string--number--fieldt-type-t-nullable-boolean-metadata-mapstring-string--null-fieldt "Direct link to fieldnewt-extends-datatype--anyname-string--number--fieldt-type-t-nullable-boolean-metadata-mapstring-string--null-fieldt")

Creates a field with explicit constructor arguments.

## Constructor[​](#constructor "Direct link to Constructor")

### `constructor(name: string, type: DataType, nullable = false, metadata?: Map<string, string> | null)`[​](#constructorname-string-type-datatype-nullable--false-metadata-mapstring-string--null "Direct link to constructorname-string-type-datatype-nullable--false-metadata-mapstring-string--null")

Creates a new immutable field descriptor.

## Methods[​](#methods "Direct link to Methods")

### `clone<T extends DataType = any>(props: { name?: string | number; type?: T; nullable?: boolean; metadata?: Map<string, string> | null }): Field<T>`[​](#clonet-extends-datatype--anyprops--name-string--number-type-t-nullable-boolean-metadata-mapstring-string--null--fieldt "Direct link to clonet-extends-datatype--anyprops--name-string--number-type-t-nullable-boolean-metadata-mapstring-string--null--fieldt")

Returns a copy with overridden metadata.

### `clone<R extends DataType = any>(name?: string | number | Field<T>, type?: R, nullable?: boolean, metadata?: Map<string, string> | null): Field<R>`[​](#cloner-extends-datatype--anyname-string--number--fieldt-type-r-nullable-boolean-metadata-mapstring-string--null-fieldr "Direct link to cloner-extends-datatype--anyname-string--number--fieldt-type-r-nullable-boolean-metadata-mapstring-string--null-fieldr")

Returns a copy with overridden properties.

### `toString(): string`[​](#tostring-string "Direct link to tostring-string")

Returns a concise string representation of the field.
