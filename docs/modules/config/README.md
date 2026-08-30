# Overview

![YAML logo](../../images/logos/yaml-logo.svg) ![TOML logo](../../images/logos/toml-logo.svg)

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

The package root exports metadata-only loaders. Use `@loaders.gl/config/bundled` when the parser
should be included in the import, or `@loaders.gl/config/unbundled` for lazy parser loading.

The YAML and TOML implementations are maintained in this repository and do not import third-party
YAML or TOML parser packages.
