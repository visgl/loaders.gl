# Field

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A `Field` is a named column component with type and nullability metadata.

## Usage

```ts
import {Field, Int32} from 'apache-arrow';

const id = Field.new({name: 'id', type: new Int32(), nullable: false});
const cloned = id.clone({nullable: true});
```

## Members

### `name: string`

Field name.

### `type: DataType`

Field data type.

### `nullable: boolean`

Whether null values are permitted.

### `metadata: Map<string, string>`

Optional field metadata.

### `typeId: Type`

The underlying `DataType` identifier.

### `readonly [Symbol.toStringTag]: string`

Debug name shown by `Object.prototype.toString`.

## Static methods

### `Field.new<T extends DataType = any>(props: { name: string | number; type: T; nullable?: boolean; metadata?: Map<string, string> | null }): Field<T>`

### `Field.new<T extends DataType = any>(name: string | number | Field<T>, type: T, nullable?: boolean, metadata?: Map<string, string> | null): Field<T>`

Creates a field with explicit constructor arguments.

## Constructor

### `constructor(name: string, type: DataType, nullable = false, metadata?: Map<string, string> | null)`

Creates a new immutable field descriptor.

## Methods

### `clone<T extends DataType = any>(props: { name?: string | number; type?: T; nullable?: boolean; metadata?: Map<string, string> | null }): Field<T>`

Returns a copy with overridden metadata.

### `clone<R extends DataType = any>(name?: string | number | Field<T>, type?: R, nullable?: boolean, metadata?: Map<string, string> | null): Field<R>`

Returns a copy with overridden properties.

### `toString(): string`

Returns a concise string representation of the field.
