# Column

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Legacy name for a chunked column-like vector. In modern Arrow JS, prefer `Vector`/`Chunked` for most table column usage.

## Usage

Copy a column

```typescript
const typedArray = column.slice();
```

Get a contiguous typed array from a `Column` (creates a new typed array unless only one chunk)

```typescript
const typedArray = column.toArray();
```

columns are iterable

```typescript
let max = column.get(0);
let min = max;
for (const value of column) {
  if (value > max) max = value;
  else if (value < min) min = value;
}
```

## Inheritance

## Fields

In addition to fields inherited from `Chunked`, Colum also defines

### name : String

The name of the column (short for `field.name`)

### field : Field

Returns the `Field` instance that describes for the column.

## Methods

### constructor(field : Field, vectors: Vector, offsets?: Uint32Array)

### clone

Returns a new `Column` instance with the same properties.

### getChildAt(index : Number) : Vector

Returns the `Vector` that contains the element with
