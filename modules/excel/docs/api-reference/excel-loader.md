# ExcelLoader

(Non-streaming) table loader for Excel files.

| Loader         | Characteristic                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.xls`, `.xlsb`, `.xlsx`                                                                                            |
| File Type      | Binary                                                                                                              |
| File Format    | [Excel](https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-xls/cd03cb5f-ca02-4934-a391-bb674cb8aa06) |
| Data Format    | [Classic Table](/docs/specifications/category-table)                                                                |
| Supported APIs | `load`, `parse`                                                                                                     |

## Usage

```js
import {ExcelLoader} from '@loaders.gl/excel';
import {load} from '@loaders.gl/core';

const data = await load(url, ExcelLoader, {excel: options});
```

## Options

| Option        | From                                                                                  | Type            | Default | Description                                           |
| ------------- | ------------------------------------------------------------------------------------- | --------------- | ------- | ----------------------------------------------------- |
| `excel.sheet` | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `string | null` | `null`  | Which worksheet to load. By default loads first sheet |

## Attribution

The `ExcelLoader` is a wrapper around [`SheetJS`](https://github.com/SheetJS/sheetjs) which is Apache 2.0 licensed.
