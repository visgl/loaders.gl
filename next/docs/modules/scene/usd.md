# OpenUSD

The `@loaders.gl/scene/usd` entrypoint loads OpenUSD stages while preserving prim hierarchy, authored metadata, and supported composition features. Install the scene package:

```
npm install @loaders.gl/core @loaders.gl/scene
```

```
import {load} from '@loaders.gl/core';

import {USDLoader} from '@loaders.gl/scene/usd';



const stage = await load('scene.usda', USDLoader);
```

See [USDLoader](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md) for supported encodings, reference loading, composition options, and implementation limits, and [the OpenUSD format](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) for format background. Other scene formats are listed in the [scene package](https://loaders.gl/next/docs/modules/scene.md).
