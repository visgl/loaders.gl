# @loaders.gl/config

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent parsers and encoders.

This module contains dependency-free loaders for the YAML (YAML Ain't Markup Language) and TOML configuration formats. The package exposes metadata-only loaders from its root entry point, parser-bearing loaders from `bundled`, and lazy parser loading from `unbundled`.

```js
import {parse} from '@loaders.gl/core';
import {YAMLLoader, TOMLLoader} from '@loaders.gl/config/bundled';

const yaml = YAMLLoader.parseTextSync('enabled: true');
const toml = await parse('enabled = true', TOMLLoader);
```

The parser implementations are included in this package and do not depend on third-party YAML or TOML parser packages.
