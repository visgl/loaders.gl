# Schemas

The `Schema` class stores a list of `Field` instances that provide 
information about the columns in a table: name, data type and nullability.

A `Schema` can also contain metadata, both on the table level and on each Field.

Every `Table` and `RecordBatch` contains a `Schema` instance.

:::info
Note that since Arrow allows for composite columns (`List`, `Struct`, `Map_` etc),
data types can contain nested `Field` objects.
:::

### Create a new Schema




### Working with Arrow Schemas

Get the names of the columns in a table.

```typescript
const fieldNames = table.schema.fields.map(f => f.name);
// Array(3) ["Latitude", "Longitude", "Date"]
```

```typescript
const fieldTypes = schema.fields.map(f => f.type)
// Array(3) [Float, Float, Timestamp]

const fieldTypeNames = ...;
// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]
```

