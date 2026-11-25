# YAML and TOML documents

YAML and TOML now belong to [@loaders.gl/documents](https://loaders.gl/docs/modules/documents.md).

[![](/images/format-logos/yaml-logo.svg)](https://loaders.gl/docs/modules/documents/config/formats/yaml.md) [![](/images/format-logos/toml-logo.svg)TOML](https://loaders.gl/docs/modules/documents/config/formats/toml.md)

The `@loaders.gl/documents` module provides dependency-free parsers for YAML and TOML configuration documents. Both loaders return ordinary JavaScript objects, arrays, and scalar values through the standard loaders.gl APIs.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/documents
```

## Loaders[​](#loaders "Direct link to Loaders")

| Loader                                                                                        | Description                                         |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`YAMLLoader`](https://loaders.gl/docs/modules/documents/config/api-reference/yaml-loader.md) | Loads YAML documents from `.yaml` and `.yml` files. |
| [`TOMLLoader`](https://loaders.gl/docs/modules/documents/config/api-reference/toml-loader.md) | Loads TOML documents from `.toml` files.            |

Import `YAMLLoader` from `@loaders.gl/documents/yaml` or `TOMLLoader` from `@loaders.gl/documents/toml` to defer loading the parser. For synchronous parsing, import the same loader name from its `/bundled` subpath.

The YAML and TOML implementations are maintained in this repository and do not import third-party YAML or TOML parser packages.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/documents/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits.md).
