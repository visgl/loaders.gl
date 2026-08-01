# @loaders.gl/scene

Framework-independent loaders for scene description formats.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/scene
```

## Loaders

- `USDLoader` loads ASCII USDA layers and uncompressed USDZ archives with an ASCII root layer.

```typescript
import {load} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene';

const stage = await load('scene.usda', USDLoader);
```

The loader can compose referenced layers, authored variants, and local overrides. Binary USDC
crate layers are not yet supported.
