# DataFrame

Extends `Table`

## Methods

### filter(predicate: Predicate) : FilteredDataFrame

Returns: A `FilteredDataFrame` which is a subclass of `DataFrame`, allowing you to chain additional data frame operations, including applying additional filters.

Note that this operation just registers filter predicates and is this very cheap to call. No actual filtering is done until iteration starts.

### scan(next: Function, bind?: Function)

Performantly iterates over all non-filtered rows in the data frame.

* `next` `(idx: number, batch: RecordBatch) => void` -
* `bind` `(batch: RecordBatch) => void` - Optional, typically used to generate high-performance per-batch accessor functions for `next`.

### countBy(name: Col | String) : CountByResult

