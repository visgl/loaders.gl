# Node platform adapters

Import `@loaders.gl/core/polyfills` to install loaders.gl's Node filesystem, image, and library-loading adapters before using APIs that need them. Install `@loaders.gl/core`; the subpath is part of that package.

```
import '@loaders.gl/core/polyfills';

import {load} from '@loaders.gl/core';
```

Modern Node already supplies fetch and web streams. The polyfills implementation is independent of the core root, other core entrypoints, and other loaders.gl packages. Image support may need additional optional packages; see the [polyfill reference](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md) for the installed capabilities, optional dependencies, and limitations.
