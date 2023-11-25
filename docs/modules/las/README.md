# Overview

The `@loaders.gl/las` module supports the [LASER file format](/docs/modules/las/formats/las) (LAS) and its compressed version (LAZ).

:::caution
The `@loaders.gl/las` only supports LAS/lAZ files up to LAS v1.3. The `LAZLoader` does not support LAS v1.4 files. 
There is a discussion in [Github Issues](https://github.com/visgl/loaders.gl/issues/591).
:::

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/las
```

## Attribution

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.
