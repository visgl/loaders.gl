# Data

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Untyped storage backing for `Vector`.

Think of `Data` as a chunk: typed arrays and metadata for one contiguous segment.

## Usage

```ts
import {makeData, Int32} from 'apache-arrow';

const data = makeData({
  type: new Int32(),
  data: new Int32Array([1, 2, 3]),
  length: 3,
  nullCount: 0
});
```

```ts
import {makeData, Int32} from 'apache-arrow';

const data = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});
const copy = data.slice(0, 1);
console.log(copy.length, copy.getValid(0));
```

## Members

### `type: T`

The logical `DataType`.

### `length: number`

Number of logical elements.

### `offset: number`

Logical offset into the underlying buffers.

### `stride: number`

Elements per logical slot.

### `children: Data[]`

Nested child data.

### `dictionary?: Vector`

Optional dictionary backing (for `Dictionary` type only).

### `values: TBuffer[BufferType.DATA]`

Primary values buffer.

### `typeIds: TBuffer[BufferType.TYPE]`

Dictionary/union type id buffer.

### `nullBitmap: TBuffer[BufferType.VALIDITY]`

Validity bitmask.

### `valueOffsets: TBuffer[BufferType.OFFSET]`

Offset buffers for variable-width types.

### `ArrayType: T['ArrayType']`

Physical JS typed array constructor.

### `typeId: T['TType']`

Underlying type enum id.

### `buffers: Buffers<T>`

Named tuple view of data buffers.

### `nullable: boolean`

Whether the element type can represent null.

### `byteLength: number`

Byte size across buffers.

### `nullCount: number`

Computed number of null rows.

## Factory usage

`Data` objects are created via `makeData()` in the `apache-arrow` exports.

## Methods

### `constructor(type: T, offset: number, length: number, nullCount?: number, buffers?: Partial<Buffers<T>> | Data<T>, children?: Data[], dictionary?: Vector)`

Low-level constructor used for manual `Data` assembly and advanced integrations.

### `getValid(index: number): boolean`

Returns whether element is non-null.

### `setValid(index: number, value: boolean): boolean`

Set nullability state for one element.

### `clone<R extends DataType = T>(type?: R, offset?: number, length?: number, nullCount?: number, buffers?: Buffers<R>, children?: Data[]): Data<R>`

Clone and optionally override metadata.

### `slice(offset: number, length: number): Data<T>`

Create a sliced data instance.
