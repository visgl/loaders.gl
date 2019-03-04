# Data Frame Operations

Note that `Table` inherits from `DataFrame`, so many examples will apply `DataFrame` methods to `Table`s.

Part of the power of data frame operations is that they typically do not actually perform any modifications (copying etc) of the underlying data, and ultimately only impact how iteration over that data is done, and what "view" of the data is presented. This allows data frame operations to be extremely performant, even when applied on very big (multi-gigabyte) data aset.

Most of the data frame operations do not modify the original `Table` or `DataFrame`, but rather return a new similar object with the new "iteration constraints" applied.

References:
* Much of the text in this section is adapted from Brian Hulette's [Introduction to Apache Arrow](https://observablehq.com/@theneuralbit/introduction-to-apache-arrow)


## Removing Rows

The simples way to remove rows from a data frame mey be use `Table.slice(start, end)`. As usual this operation return `Table`/`DataFrame` with iteration constrained to a sub set of the rows in the original frame.


## Removing Columns

The `Table.select(keys: String[])` method drops all columns except the ones that match the supplied `keys`.


## Filtering Rows

Another way to "remove" rows fromn data frames to apply filters. Filters effectively remove rows from the data frame that don't fullfill the predicates in the filter.

```js
const selectedName = '';
const dataFrame = table.filter(arrow.predicate.col('name').eq(selectedName)); // Remove all rows
```

The provided predicates allows for the comparison of column values against literals or javascript values (equality, greater or equal than, less or equal than) as well as the creation of composite logical expressions (`and`, `or` and `not`) out of individual column comparisons.

It is of course also possible to write custom predicates by supplying an arbitrary JavaScript function to filter a row, however performance is usually best when using the built-in comparison predicates.

> Note that calling `filter()` on a `DataFrame` doesn't actually remove any rows from the underlying data store (it just stores the predicates). It's not until you iterate over the date, e.g. by calling `countBy()` or `scan()` that we actually scan through all of the data.


## Counting Rows

To count the number of times different values appear in a table, use `countBy()`.

```js
const newTable = table.countBy('column_name');
```

Note that `countBy()` does not return a modified data frame or table, but instead returns a new `Table` that contains two columns, `value` and `count`. Each distinct value in the specified column in the original table is listed once in `value`, and the corresponding `count` field in the same row indicates how many times it was present in the original table.

Note: Technically a subclass called `CountByResult`).

Note that the results are not sorted.

## Sorting

DataFrames do not currently support sorting. To sort you need to move the data back to JavaScript arrays.


## Iterating over a DataFrame (Scanning)

The `DataFrame.scan()` method lets you define a custom function that will be called for each (non-filtered) record in the `DataFrame`.

Note: For simpler use cases, it is recommended to use the Arrow API provided predicates etc rather than writing a custom scan function, as performance will often be better.


### Writing a `next` callback for `scan()`

In order to be more efficient, Arrow data is broken up into batches of records (which is what makes it possible to do concatenations despite the columnar layout, and `DataFrame.scan()` does not hide this implementation detail from you.


### Optimizing `scan()` performance with `bind()` callbacks

In addition to the `next` callback, you can supply a `bind` function for scan to call each time it starts reading from a new `RecordBatch`. `scan` will call these functions as illustrated in the following pseudo-code:

```js
for (batch of batches) {
  bind(batch);
  for (idx in batch) {
    next(idx, batch);
  }
}
```

Note:
* The idx passed to next only applies to the current RecordBatch, it is not a global index.
* The current `RecordBatch` is passed to `next`, so it is possible to access data without writing a bind function, but there will be a performance penalty if your data has a lot of batches.
