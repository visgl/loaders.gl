# @loaders.gl/ply

[loaders.gl](https://loaders.gl/docs) is a collection of loaders for big data visualizations.

This module contains loaders for the PLY format.

## Gaussian splats

Gaussian Splat PLY files can be parsed into a renderer-oriented attribute set by opting in to
the `gaussian-splats` shape:

```ts
import {parse} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';

const splats = await parse(arrayBuffer, PLYLoader, {
  ply: {shape: 'gaussian-splats'}
});

console.log(splats.header.splatCount);
console.log(splats.attributes.POSITION);
console.log(splats.attributes.SCALE);
console.log(splats.attributes.ROTATION);
console.log(splats.attributes.OPACITY);
console.log(splats.attributes.COLOR_0);
```

The default PLY behavior remains unchanged. Without `shape: 'gaussian-splats'`, the loader
returns mesh/point-cloud data.

For documentation please visit the [website](https://loaders.gl).
