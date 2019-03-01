# DataFrame

Extends `Table`

## Methods

### filter(predicate: Predicate) : FilteredDataFrame

### scan(next: Function, bind?: Function)

* `bind` (batch: RecordBatch) => void -
* `next` (idx: number, batch: RecordBatch) => void -

### countBy(name: Col | String) : CountByResult
