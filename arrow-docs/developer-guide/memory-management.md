# Notes on Memory Management

* Arrow reads in arrow data as arraybuffer(s) and then creates chunks that are "sub array views" into that big array buffer, and lists of those chunks are then composed into "logical" arrays.
* Chunks are created for each column in each RecordBatch.
* The chunks can be "sliced and diced" by operations on `Column`, `Table` and `DataFrame` objects, but are never copied (as long as flattening is not requested) and are conceptually immutable. (There is a low-level `Vector.set()` method however given that it could modify data that is used by multiple objects its use should be reserved for cases where implications are fully understood).
