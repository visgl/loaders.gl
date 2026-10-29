# Overview

![](/next/images/format-logos/yaml-logo.svg) ![](/next/images/format-logos/toml-logo.svg)

The `@loaders.gl/config` module provides dependency-free parsers for YAML and TOML configuration documents. Both loaders return ordinary JavaScript objects, arrays, and scalar values through the standard loaders.gl APIs.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/config
```

## Loaders[​](#loaders "Direct link to Loaders")

| Loader                                                                                        | Description                                         |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`YAMLLoader`](https://loaders.gl/next/docs/modules/config/api-reference/yaml-loader.md) | Loads YAML documents from `.yaml` and `.yml` files. |
| [`TOMLLoader`](https://loaders.gl/next/docs/modules/config/api-reference/toml-loader.md) | Loads TOML documents from `.toml` files.            |

The package root and `/yaml` and `/toml` subpaths export metadata-only loaders. Async core APIs preload the parser automatically. For synchronous parsing, import `YAMLLoaderWithParser` from `@loaders.gl/config/yaml-loader` or `TOMLLoaderWithParser` from `@loaders.gl/config/toml-loader`.

The YAML and TOML implementations are maintained in this repository and do not import third-party YAML or TOML parser packages.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/config/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
