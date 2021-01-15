# ExcelLoader

Loader for Excel files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.xls`, `.xlsb`, '.xlsx`                             |
| File Type      | Text                                                 |
| File Format    | [Excel]()                                            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`                                      |

## Usage

```js
import {ExcelLoader} from '@loaders.gl/excel';
import {load} from '@loaders.gl/core';

const data = await load(url, ExcelLoader, {excel: options});
```

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type       | Default                                                                                                                                          | Description                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `excel.table`          | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`  | `false`                                                                                                                                          | Parses non-streaming Excel as table, i.e. return the first embedded array in the Excel. Always `true` during batched/streaming parsing. |
| `excel.excelpaths`     | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`                                                                                                                                             | A list of Excel paths (see below) indicating the array that can be streamed.                                                            |
| `metadata` (top level) | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`  | If `true`, yields an initial and final batch containing the partial and final result (i.e. the root object, excluding the array being streamed). |

## ExcelPaths

A minimal subset of the ExcelPath syntax is supported, to specify which array in a Excel object should be streamed as batchs.

`$.component1.component2.component3`

- No support for wildcards, brackets etc. Only paths starting with `$` (Excel root) are supported.
- Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
