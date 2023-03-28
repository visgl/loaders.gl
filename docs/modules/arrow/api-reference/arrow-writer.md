# ArrowWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `ArrowWriter` encodes a set of arrays into an ArrayBuffer of Apach Arrow columnar format.

| Loader          | Characteristic                                                              |
| --------------- | --------------------------------------------------------------------------- |
| File Extensions | `.arrow`, `.feather`                                                        |
| File Type       | Binary                                                                      |
| File Format     | [Arrow](https://arrow.apache.org/docs/format/Columnar.html#ipc-file-format) |
| Data Format     | [Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html) |
| Support API     | `encodeSync`                                                                |

## Usage

```js
import {encodeSync} from '@loaders.gl/core';
import {ArrowWriter, VECTOR_TYPES} from '@loaders.gl/arrow';

const LENGTH = 2000;

const rainAmounts = Float32Array.from({length: LENGTH}, () =>
  Number((Math.random() * 20).toFixed(1))
);

const rainDates = Array.from(
  {length: LENGTH},
  (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
);

const arraysData = [
  {array: rainAmounts, name: 'precipitation', type: VECTOR_TYPES.FLOAT},
  {array: rainDates, name: 'date', type: VECTOR_TYPES.DATE}
];

const arrayBuffer = encodeSync(arraysData, ArrowWriter);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
|        |      |         |             |

## Dependencies

[Apache Arrow JS](https://arrow.apache.org/docs/js/) library is included into the bundle.
