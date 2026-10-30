import {FormatLogo} from '@site/src/components/docs/format-logo';

# YAML and TOML documents

YAML and TOML now belong to [@loaders.gl/documents](/docs/modules/documents).

<FormatLogo slug="yaml" /> <FormatLogo slug="toml" />

The `@loaders.gl/documents` module provides dependency-free parsers for YAML and TOML configuration
documents. Both loaders return ordinary JavaScript objects, arrays, and scalar values through the
standard loaders.gl APIs.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/documents
```

## Loaders

| Loader | Description |
| --- | --- |
| [`YAMLLoader`](/docs/modules/documents/config/api-reference/yaml-loader) | Loads YAML documents from `.yaml` and `.yml` files. |
| [`TOMLLoader`](/docs/modules/documents/config/api-reference/toml-loader) | Loads TOML documents from `.toml` files. |

The package root exports metadata-only loaders. Async core APIs preload the parser automatically. For synchronous parsing, import `YAMLLoaderWithParser` from `@loaders.gl/documents/yaml-loader` or `TOMLLoaderWithParser` from `@loaders.gl/documents/toml-loader`.

The YAML and TOML implementations are maintained in this repository and do not import third-party
YAML or TOML parser packages.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/documents/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).
