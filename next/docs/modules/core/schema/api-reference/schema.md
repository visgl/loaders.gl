Schema module · schema API

# Schema

Describe table fields, types, and metadata in a serializable form that can travel with decoded data and remain useful across loaders.

[Schema module](https://loaders.gl/next/docs/modules/core/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema.md)[Table API](https://loaders.gl/next/docs/modules/core/schema/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema/api-reference/table.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The schema boundary

## Make the table’s meaning explicit.

A schema records field names, types, and metadata so consumers do not have to rediscover the contract from values alone. This matters especially for binary and geospatial columns.

01

Fields

Names, types, nullability, and metadata

02

Inference

Useful for text, but not always reliable

03

Serialization

Portable descriptions for table boundaries

04

Arrow

A familiar model for typed columns

Detailed guide

## Schema reference

The sections below cover schema deduction, serialization, and Arrow-compatible schema concepts.

loaders.gl provides a simple serializable schema class to help describe tables and table like data. The Schema is modelled after Arrow.

## Schema Deduction[​](#schema-deduction "Direct link to Schema Deduction")

Schemas can be deduced, but unless the data format is binary, this can lead to mistakes.

For instance, should a column with zip codes in a CSV be treated as strings or numbers? (Most auto detection systems would classify the type as numbers, but most users would prefer for that column to be classified as string, to avoid potential dropping of leading zeroes among other things.)

## Schema Serialization[​](#schema-serialization "Direct link to Schema Serialization")

..

## Apache Arrow Schemas[​](#apache-arrow-schemas "Direct link to Apache Arrow Schemas")

...
