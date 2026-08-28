# Overview

![flatgeobuf-logo](./images/flatgeobuf-logo.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/arrow_output-From_v5.0-blue.svg?style=flat-square" alt="arrow output from v5.0" />
  <img src="https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square" alt="source loader from v5.0" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

The `@loaders.gl/flatgeobuf` module handles the [FlatGeobuf](http://flatgeobuf.org/) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

FlatGeobuf sources support schema discovery, bounding-box pruning, residual predicates, projection,
limits, cancellation, and Arrow feature batches through the common scan contract.

## Installation

```bash
npm install @loaders.gl/flatgeobuf
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader / Source | Description |
| --------------- | ----------- |
| [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader) | Loads FlatGeobuf files as geospatial tables. |
| [`FlatGeobufSourceLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader) <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> | Streams features and spatially filtered data from FlatGeobuf sources. |

## Attribution

The `FlatGeobufLoader` forks the [`flatgeobuf`](https://github.com/bjornharrtell/flatgeobuf) NPM module under the BSD 2-Clause license.
