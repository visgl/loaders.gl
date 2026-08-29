# JSON-style Loaders

The _json_ category loaders supports loading loosely structured data, including configuration
documents, with values such as:

- associative arrays (also known as name-value pairs),
- integer indexed arrays
- and a suite of fundamental scalar types.

## JSON Category Loaders

| Loader                                                       | Notes |
| ------------------------------------------------------------ | ----- |
| [`JSONLoader`](/docs/modules/json/api-reference/json-loader) |       |
| [`BSONLoader`](/docs/modules/bson/api-reference/bson-loader) |       |
| [`XMLLoader`](/docs/modules/xml/api-reference/xml-loader)    |       |
| [`HTMLLoader`](/docs/modules/xml/api-reference/html-loader)  |       |
| [`YAMLLoader`](/docs/modules/config/api-reference/yaml-loader) | Human-readable YAML documents; provided by `@loaders.gl/config`. |
| [`TOMLLoader`](/docs/modules/config/api-reference/toml-loader) | Configuration-oriented TOML documents; provided by `@loaders.gl/config`. |

## Data Structure

Objects and arrays containing other object and arrays or primitive values.

YAML and TOML are not JSON syntax, but their parsers produce the same general JavaScript data
shapes and are therefore included here for discovery alongside other JSON-style loaders.
