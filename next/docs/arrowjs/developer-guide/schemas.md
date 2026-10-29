Arrow JavaScript · schemas

# Let the schema tell you what the buffers mean.

An Arrow Schema is the compact contract for a table or record batch: fields name the columns, types describe their logical values, and metadata carries the context that applications should not have to infer.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Schema API](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)[Field API](https://loaders.gl/next/docs/arrowjs/api-reference/field.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/field.md)

The schema contract

## Names, types, and metadata travel with the data.

Schemas make a table self-describing, including nested fields inside list, struct, and map types. A consumer can inspect the shape before choosing how to render, transform, or export it.

01

Field

Name, logical type, nullability, and metadata

02

Schema

An ordered collection of fields and table metadata

03

Nested

Child fields for list, struct, and map values

04

Used by

Tables and record batches alike

Detailed guide

## Schema details

The examples below cover schema inspection, field types, nullability, metadata, and nested Arrow data types.

# Schemas

The `Schema` class stores a list of `Field` instances that provide information about the columns in a table: name, data type and nullability.

A `Schema` can also contain metadata, both on the table level and on each Field.

Every `Table` and `RecordBatch` contains a `Schema` instance.

info

Note that since Arrow allows for composite columns (`List`, `Struct`, `Map_` etc), data types can contain nested `Field` objects.

### Create a new Schema[​](#create-a-new-schema "Direct link to Create a new Schema")

```
import {Schema, Field, Float64, Utf8} from 'apache-arrow';



const schema = new Schema([

  new Field('latitude', new Float64(), true),

  new Field('name', new Utf8(), true)

]);
```

### Working with Arrow Schemas[​](#working-with-arrow-schemas "Direct link to Working with Arrow Schemas")

Get the names of the columns in a table.

```
const fieldNames = table.schema.fields.map((f) => f.name);

// Array(3) ["Latitude", "Longitude", "Date"]
```

```
const fieldTypes = schema.fields.map(f => f.type)

// Array(3) [Float, Float, Timestamp]



const fieldTypeNames = schema.fields.map(field => field.type.toString());

// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]
```
