# Predicates

> This documentation reflects Arrow JS v4.0. Needs to be updated for the new Arrow API in v9.0 +.

## Value

## Literal

## Col

The Col predicate gets the value of the specified column

### bind(batch : RecordBatch) : Function

Returns a more efficient accessor for the column values in this batch, taking local indices.

Note: These accessors are typically created in the `DataFrame.scan` bind method, and then used in the the `DataFrame.next` method.

## ComparisonPredicate

## And

## Or

## Equals

## LTEq

## GTEq

## Not

## CustomPredicate
