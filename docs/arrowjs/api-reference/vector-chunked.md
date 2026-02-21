# Chunked

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

`Chunked` is not a separate public class in Apache Arrow JS v21.
The public model is that a `Vector<T>` can represent multiple chunks when constructed from multiple `Data<T>` buffers.

## Usage

```ts
import {makeData, Vector, Int32} from 'apache-arrow';

const chunkA = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});
const chunkB = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([3, 4])});
const vector = new Vector([chunkA, chunkB]);
console.log(vector.length);
```

## v21 behavior

- Constructing a vector from multiple data segments yields a chunked vector instance.
- `slice`, `concat`, and iteration work across chunk boundaries.
- Child vectors and row access continue to use [`Vector`](/docs/arrowjs/api-reference/vector) semantics.

```ts
import {makeData, Data, Vector, Int32} from 'apache-arrow';

const chunkA = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});
const chunkB = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([3, 4])});
const vector = new Vector<Data>([chunkA, chunkB]);
console.log(vector.length); // 4
```
