# ExcelArrowLoader

(Non-streaming) table loader for Excel files that returns Apache Arrow tables.

| Loader         | Characteristic                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.xls`, `.xlsb`, `.xlsx`                                                                                            |
| File Type      | Binary                                                                                                              |
| File Format    | [Excel](https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-xls/cd03cb5f-ca02-4934-a391-bb674cb8aa06) |
| Data Format    | [Apache Arrow Table](/docs/developer-guide/apache-arrow)                                                            |
| Supported APIs | `load`, `parse`                                                                                                     |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {ExcelArrowLoader} from '@loaders.gl/excel';

const table = await load(url, ExcelArrowLoader, {excel: options});

const zipCodeColumn = table.data.getChild('zip_code');
const firstZipCode = zipCodeColumn?.get(0);
```

`ExcelArrowLoader` supports the same file formats and options as [`ExcelLoader`](/docs/modules/excel/api-reference/excel-loader), but converts the parsed worksheet rows into an Apache Arrow table.

The parsed Arrow columns contain the same row values as `ExcelLoader`; use `ExcelArrowLoader` when the consumer prefers columnar Apache Arrow data over object-row tables.

## Options

| Option        | Type             | Default | Description                                       |
| ------------- | ---------------- | ------- | ------------------------------------------------- |
| `excel.sheet` | `string \| null` | `null`  | Which worksheet to load. Defaults to first sheet. |

## Attribution

The `ExcelArrowLoader` uses the same [`SheetJS`](https://github.com/SheetJS/sheetjs) based parser as `ExcelLoader`.
