Arrow JavaScript · memory

# Keep columns as views over the buffers you already have.

Arrow’s memory model is built around contiguous buffers, chunked record batches, and logical vectors that can share those buffers. That makes slicing and transfer inexpensive when the operation does not require flattening.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Data API](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)[Binary data](https://loaders.gl/next/docs/developer-guide/concepts/binary-data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/binary-data.md)

The memory model

## Share storage first; materialize only at a boundary.

Record batches own chunks of column data. Tables and vectors compose views over those chunks, so many reads can avoid copying until the application explicitly asks for a flattened or converted representation.

01

Buffers

Incoming ArrayBuffers hold contiguous bytes

02

Chunks

Each record batch contributes column slices

03

Views

Vectors and tables compose logical columns

04

Copies

Flattening and conversion create new storage

Detailed guide

## Memory management details

The notes below explain buffer ownership, chunked columns, slicing, immutability, and the operations that cross the no-copy boundary.

# Notes on Memory Management

Apache Arrow is a performance-optimized architecture, and the foundation of that performance is the approach to memory management. It can be useful to have an understanding of how.

## How Arrow Stores Data[​](#how-arrow-stores-data "Direct link to How Arrow Stores Data")

Arrow reads in arrow data as arraybuffer(s) and then creates chunks that are "sub array views" into that big array buffer, and lists of those chunks are then composed into "logical" arrays.

Chunks are created for each column in each RecordBatch.

The chunks can be "sliced and diced" by operations on `Column`, `Table` and `DataFrame` objects, but are never copied (as long as flattening is not requested) and are conceptually immutable. (There is a low-level `Vector.set()` method however given that it could modify data that is used by multiple objects its use should be reserved for cases where implications are fully understood).
