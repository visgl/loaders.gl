Loader category

# Structured data without a special application model.

JSON-style loaders cover nested objects, arrays, scalar values, and related document formats. Use the same loaders.gl entry points for JSON, BSON, XML, and HTML when the application needs structured data rather than a geometry or table-specific shape.

[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[JSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[BSON​Loader↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md)[XML​Loader↗](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[HTML​Loader↗](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)[YAML​Loader↗](https://loaders.gl/next/docs/modules/config/api-reference/yaml-loader.md)[TOML​Loader↗](https://loaders.gl/next/docs/modules/config/api-reference/toml-loader.md)

Data

[JSON-style dataObjects / arrays↗](https://loaders.gl/next/docs/specifications/category-json.md)

Encode

[JSON​Writer↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[BSON​Writer↗](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-writer.md)

Flexible input, explicit output

## Keep the source structure until you know what to do with it.

These loaders preserve nested values and arrays as ordinary JavaScript data. Table-specific loaders and category conversion utilities are available when the next step needs columns instead.

01

Inputs

JSON, NDJSON, BSON, XML, and HTML

02

Output

Objects, arrays, scalar values, or streamed records

03

Streaming

Process newline-delimited records incrementally

04

Next step

Convert structured data into tables or application models

The JSON-style category is for loosely structured values that do not need a geometry- or table-specific result shape. Its loaders can return:

* objects with name/value pairs,
* arrays with integer indexes, and
* fundamental scalar values such as strings, numbers, booleans, and `null`.

Detailed guide

## The structured-data details

The sections below list category loaders and describe the data structures they return.

## JSON Category Loaders[​](#json-category-loaders "Direct link to JSON Category Loaders")

| Loader                                                                                             | Notes                                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`JSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md) | JSON documents and nested values                                         |
| [`BSONLoader`](https://loaders.gl/next/docs/modules/tables/bson/api-reference/bson-loader.md) | Binary JSON documents                                                    |
| [`XMLLoader`](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)           | XML documents represented as JavaScript data                             |
| [`HTMLLoader`](https://loaders.gl/next/docs/modules/xml/api-reference/html-loader.md)         | HTML documents and fragments                                             |
| [`YAMLLoader`](https://loaders.gl/next/docs/modules/config/api-reference/yaml-loader.md)      | Human-readable YAML documents; provided by `@loaders.gl/config`.         |
| [`TOMLLoader`](https://loaders.gl/next/docs/modules/config/api-reference/toml-loader.md)      | Configuration-oriented TOML documents; provided by `@loaders.gl/config`. |

## Data Structure[​](#data-structure "Direct link to Data Structure")

Objects and arrays can contain other objects, arrays, or primitive values.

YAML and TOML are not JSON syntax, but their parsers produce the same general JavaScript data shapes and are therefore included here for discovery alongside other JSON-style loaders.
