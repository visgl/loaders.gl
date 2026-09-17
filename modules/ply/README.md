# @loaders.gl/ply

[loaders.gl](https://loaders.gl/docs) is a collection of loaders for big data visualizations.

This module contains loaders for the PLY format.

## Gaussian splats

PLY files now parse as Arrow tables by default. Gaussian Splat PLY files can use the same path:

```ts
import {parse} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';

const table = await parse(arrayBuffer, PLYLoader, {
  ply: {shape: 'arrow-table'}
});

console.log(table.data.schema.metadata.get('loaders_gl.semantic_type'));
console.log(table.data.getChild('scale_0'));
console.log(table.data.getChild('rot_0'));
console.log(table.data.getChild('opacity'));
console.log(table.data.getChild('f_dc_0'));
```

GraphDECO-style Gaussian Splat PLY files are identified with
`loaders_gl.semantic_type: gaussian-splats` schema metadata. Field metadata records encoding
conventions such as `loaders_gl.gaussian_splats.encoding: log` for `scale_*` columns and
`loaders_gl.gaussian_splats.encoding: logit` for `opacity`.

Set `ply.shape: 'mesh'` explicitly when legacy mesh/point-cloud data is required.

For documentation please visit the [website](https://loaders.gl).
