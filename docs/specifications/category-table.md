# Category: Table

## Data Structure

| Field        | Type                | Contents     |
| ------------ | ------------------- | ------------ |
| `schema`     | `Object`            | Metadata of the table, maps name of each column to its type. |
| `data`       | `Object` or `Array` | Data of the table, see [table types](#table-types) |
| `length`     | `Number`            | Number of rows |


## Table Types

loaders.gl deals with (and offers utilities to convert between) three different types of tables:

### Classic Tables (Row-Major)

This is the classic JavaScript table. `data` consists of an `Array` of `Object` instances, each representing a row.

### Columnar Tables (Column-Major)

Columnar tables are stored as one array per column. Columns that are numeric can be loaded as typed arrays which are stored in contigous memory. `data` is an `Object` that maps column names to an array or typed array.

Contiguous memory has tremendous benefits:

- Values are adjacent in memory, the resulting cache locality can result in big performance gains
- Typed arrays can of course be efficiently transferred from worker threads to main thread
- Can be directly uploaded to the GPU for further processing.

### Chunked Columnar Tables (DataFrames)

A problem with columnar tables is that column arrays they can get very long, causing issues with streaming, memory allication etc. A powerful solution is to worked with chunked columnar tables, where columns is are broken into matching sequences of typed arrays.

The down-side is that complexity can increase quickly. Data Frames are optimized to minimize the amount of copying/moving/reallocation of data during common operations such e.g. loading and transformations, and support zero-cost filtering through smart iterators etc.

Using the Arrow API it is possible to work extremely efficiently with very large (multi-gigabyte) datasets.

## Loaders

- [ArrowLoader](/docs/api-reference/arrow/arrow-loader)
- [CSVLoader](/docs/api-reference/csv/csv-loader)

