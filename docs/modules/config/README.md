import {FormatLogo} from '@site/src/components/docs/format-logo';

# Overview

<FormatLogo slug="yaml" /> <FormatLogo slug="toml" />

The `@loaders.gl/config` module provides dependency-free parsers for YAML and TOML configuration
documents. Both loaders return ordinary JavaScript objects, arrays, and scalar values through the
standard loaders.gl APIs.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/config
```

## Loaders

| Loader | Description |
| --- | --- |
| [`YAMLLoader`](/docs/modules/config/api-reference/yaml-loader) | Loads YAML documents from `.yaml` and `.yml` files. |
| [`TOMLLoader`](/docs/modules/config/api-reference/toml-loader) | Loads TOML documents from `.toml` files. |

The package root and `/yaml` and `/toml` subpaths export metadata-only loaders. Async core APIs preload the parser automatically. For synchronous parsing, import `YAMLLoaderWithParser` from `@loaders.gl/config/yaml-loader` or `TOMLLoaderWithParser` from `@loaders.gl/config/toml-loader`.

The YAML and TOML implementations are maintained in this repository and do not import third-party
YAML or TOML parser packages.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/config/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).
