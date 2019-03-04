# Extracting Data

While keeping data in Arrow format allows for efficient data frame operations, there are of course cases where data needs to be extracted in a form that can be use with non-Arrow aware JavaScript code.

Many arrow classes support the following methods:

* `toArray()`
* `toJSON()`
* `toString()`


### Extracting Data by Row

```js
const row = table.get(0);
```

The row does not retain the schema, so you'll either need to know the order of columns `row.get(0)`, or use the `to*()` methods.

### Extracting Data by Column

```js
const column = table.getColumn('data');
```

### Extracting data by Column and Batch

A more efficient way to get access to data (especially if the table has not been sliced or filtered)


### Extracting predicates from a DataFrame

To do data frame filtering separately (e.g. on GPU), the frame's predicates need to be extracted:

TBA
