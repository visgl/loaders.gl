# Notes on Memory Management

Apache Arrow is a performance-optimized architecture, and the foundation of that performance is the approach to memory management. It can be useful to have an understanding of how.

## How Arrow Stores Data

Arrow reads in arrow data as arraybuffer(s) and then creates chunks that are "sub array views" into that big array buffer, and lists of those chunks are then composed into "logical" arrays.

Chunks are created for each column in each RecordBatch.

The chunks can be "sliced and diced" by operations on `Column`, `Table` and `DataFrame` objects, but are never copied (as long as flattening is not requested) and are conceptually immutable. (There is a low-level `Vector.set()` method however given that it could modify data that is used by multiple objects its use should be reserved for cases where implications are fully understood).
