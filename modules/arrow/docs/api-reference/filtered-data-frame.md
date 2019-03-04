# FilteredDataFrame



## Extends DataFrame

## Methods

### constructor(batches: RecordBatch<T>[], predicate: Predicate)
### scan(next: NextFunc, bind?: BindFunc): void
### count(): number
### [Symbol.iterator](): IterableIterator<Struct<T>['TValue']>
### filter(predicate: Predicate): FilteredDataFrame<T>
### countBy(name: Col | string): CountByResult