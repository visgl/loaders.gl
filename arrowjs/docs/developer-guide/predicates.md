# Using Predicates


The Arrow API provides standard predicates that allow for the comparison of column values against literals (equality, greater or equal than, less or eqial than) as well as the creation of composite logical expressions (`and`, `or` and `not`) out of individual column comparisons.

It is of course also possible to write custom predicates, however the performance is best when using the built-ins. Note that for performance reasons, filters are specified using "predicates" rather than custom JavaScript functions. For details on available predicates see [Using Predicates]().

## Filtering using Predicates

> Note that calling `filter()` on a `DataFrame` doesn't actually do anything (other than store the predicates). It's not until you call `countBy()` or `scan()` on the resulting object that Arrow actually scans through all of the data.

```js
table = table.filter(arrow.predicate.col('winnername').eq(winner));

for (const row of table) {
  // only returns rows that match criteria
}
```
