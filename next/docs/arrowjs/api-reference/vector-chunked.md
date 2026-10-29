Arrow JavaScript · API reference

# Let one vector span several record-batch buffers.

Apache Arrow JS v21 represents chunked data through the public Vector model. Construct a vector from multiple Data segments and keep slicing, concatenation, iteration, and row access on the same API.

[Vector API](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Data API](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)[Memory management](https://loaders.gl/next/docs/arrowjs/developer-guide/memory-management.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/memory-management.md)

The chunk boundary

## Keep batches separate without changing the column contract.

A Vector can reference several immutable Data segments. Consumers see one logical column while Arrow retains the chunk boundaries useful for incremental I/O and low-copy composition.

01

Construct

Pass multiple Data segments to Vector

02

Read

Use one logical length and standard vector access

03

Compose

Slice, concatenate, and iterate across chunks

04

Version

Aligned with the Apache Arrow JS v21 model

Detailed guide

## Chunked vector details

The examples below document the v21 public model, construction from Data buffers, and operations that cross chunk boundaries.

# Chunked

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

`Chunked` is not a separate public class in Apache Arrow JS v21. The public model is that a `Vector<T>` can represent multiple chunks when constructed from multiple `Data<T>` buffers.

## Usage[​](#usage "Direct link to Usage")

```
import {makeData, Vector, Int32} from 'apache-arrow';



const chunkA = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});

const chunkB = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([3, 4])});

const vector = new Vector([chunkA, chunkB]);

console.log(vector.length);
```

## v21 behavior[​](#v21-behavior "Direct link to v21 behavior")

* Constructing a vector from multiple data segments yields a chunked vector instance.
* `slice`, `concat`, and iteration work across chunk boundaries.
* Child vectors and row access continue to use [`Vector`](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md) semantics.

```
import {makeData, Data, Vector, Int32} from 'apache-arrow';



const chunkA = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});

const chunkB = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([3, 4])});

const vector = new Vector<Data>([chunkA, chunkB]);

console.log(vector.length); // 4
```
