# Table Category (Experimental)

## Table Types

loaders.gl deals with (and offers utilities to convert between) three different types of tables:

### Classic Tables (Row-Major)

This is the classic JavaScript table that consists of an `Array` of `Object` instances. It would be the natural output of e.g. a JSON loader or a YAML loader.

### Columnar Tables (Column-Major)

Columnar tables are stored as one array per column. Columns that are numeric can be loaded as typed arrays which are stored in contigous memory.

Contiguous memory has tremendous benefits:

- Values are adjacent in memory, the resulting cache locality can result in big performance gains
- Typed arrays can of course be efficiently transferred from worker threads to main thread
- Can be directly uploaded to the GPU for further processing.

### Chunked Columnar Tables

A problem with columnar tables is that column arrays they can get very long, causing issues with streaming, memory allication etc. A powerful solution is to worked with chunked columnar tables, where columns is are broken into matching sequences of typed arrays.

The down-side is that complexity can increase quickly and it is best to use helper libraries (such as Apache Arrow) to manage the necessary data structures and book-keeping.

### DataFrames (Arrow)

Data Frames are optimized to minimize the amount of copying/moving/reallocation of data during common operations such e.g. loading and transformations, and support zero-cost filtering through smart iterators etc.

Using the Arrow API it is possible to work extremely efficiently with very large (multi-gigabyte) datasets.

## Table Schemas

For certain operations, it is useful to have a schema that describes the columns in the table. loaders.gl defines a simple schema object, as follows

## Utilities

A set of utilities is provided.

- `deduceTableSchema(table)` - returns a schema object, autodeduced from columnar or other tables
-
