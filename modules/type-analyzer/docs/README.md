# @loaders.gl/type-analyzer

Infer data types from JavaScript table columns. A primary goal is to help
applications extract schemas from schema-less textual tabular formats such as CSV.

## Overview

This package provides a single interface for generating the datatype for a given
row-column formatted dataset. We support the following data types:

- **DATE**
- **TIME**
- **DATETIME**
- **NUMBER**
- **INT**
- **FLOAT**
- **CURRENCY**
- **PERCENT**
- **STRING**
- **ARRAY**
- **OBJECT**
- **ZIPCODE**
- **BOOLEAN**
- **GEOMETRY**
- **GEOMETRY_FROM_STRING**
- **PAIR_GEOMETRY_FROM_STRING**
- **NONE**

## Installation

```sh
    npm install @loaders.gl/type-analyzer
```

## Usage

### `computeColumnMetadata(data, rules, options)` 

**Parameters**

- `data` **Array** _required_ An array of row object
- `rules` **Array** _optional_ An array of custom regex rules
- `options` **Object** _optional_ Option object
- `options.ignoreDataTypes` **Array** _optional_ Data types to ignore

```typescript
import {computeColumnMetadata} from 'loaders.gl/type-analyzer';
const data = [
  {
    ST_AsText: 'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
    name: 'san_francisco',
    lat: '37.7749295',
    lng: '-122.4194155',
    launch_date: '2010-06-05',
    added_at: '2010-06-05 12:00'
  },
  {
    ST_AsText: 'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
    name: 'paris',
    lat: '48.856666',
    lng: '2.3509871',
    launch_date: '2011-12-04',
    added_at: '2010-06-05 12:00'
  }
];
const columnMetadata = computeColumnMetadata(data);
```

- **`rules`**

You can pass in an array of custom rules. For example. if you want to ensure that a column full of ids represented as numbers is identified as a column of strings. Rules can be matched with either exact `name` of the column, or `regex` used to match names. Note: computeColumnMetadata prefers rules using name over regex since better performance.

```typescript
import {computeColumnMetadata} from 'loaders.gl/type-analyzer';

const columnMetadata = computeColumnMetadata(data, [{name: 'id', dataType: 'STRING'}]);
// or
const columnMetadata = computeColumnMetadata(data, [{regex: /id/, dataType: 'STRING'}]);
```

- **`options.ignoreDataTypes`**

You can also pass in `ignoreDataTypes` to ignore certain types. This will improve your type checking performance.

```typescript
import {DATA_TYPES} from 'loaders.gl/type-analyzer';

const columnMetadata = computeColumnMetadata(arr, [], {ignoredDataTypes: DATA_TYPES.CURRENCY})[0].type,
```

And it will short cut around the usual analysis system and give
you back the column formatted as you'd expect.

### `DATA_TYPES`

You can import all available types as a constant.


## Attributions

The `@loaders.gl/type-analyzer` module is a fork of 
Uber's [type-analyzer](https://github.com/uber-web/type-analyzer) under MIT license.

The type analyzer was originally developed to support table loading in [kepler.gl](https://kepler.gl).
In this fork it has been integrated with the runtime type system in `@loaders.gl/schema`
