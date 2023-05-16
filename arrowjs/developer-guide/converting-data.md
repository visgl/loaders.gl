# Extracting Data

While keeping data in Arrow format allows for efficient data frame operations, there are of course cases where data needs to be extracted in a form that can be use with non-Arrow-aware JavaScript code.

### Converting Data

Many arrow classes support the following methods:

* `toArray()` - Typically returns a typed array.
* `toJSON()` - Arrow JS types can be converted to JSON.
* `toString()` - Arrow JS types can be converted to strings.

### Extracting Data by Row

You can get a temporary object representing a row in a table.

```js
const row = table.get(0);
```

Note that the `row` does not retain the schema, so you'll either need to know the order of columns `row.get(0)`, or use the `to*()` methods.

### Extracting Data by Column

More efficient is to get a column.

```js
const column = table.getColumn('data');
```

The column can be chunked, so to get a contiguous (typed) array, call

```js
const array = table.getColumn('columnName').toArray();
```

Note that if there are multiple chunks in the array, this will create a new typed array and copy the typed arrays in the chunks into that array.

### Extracting data by Column and Batch

A more efficient (zero-copy) way to get access to data (especially if the table has not been sliced or filtered) could be to walk through the chunks in each column and get the underlying typed array for that chunk.
