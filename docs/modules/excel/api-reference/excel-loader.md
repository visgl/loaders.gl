# Excel Loaders

Non-streaming table loaders for Excel files.

| Loader             | Output           | Use when                      |
| ------------------ | ---------------- | ----------------------------- |
| `ExcelLoader`      | `ObjectRowTable` | You want JavaScript row data. |
| `ExcelArrowLoader` | `ArrowTable`     | You want columnar table data. |

| Characteristic | Value                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.xls`, `.xlsb`, `.xlsx`                                                                                            |
| File Type      | Binary                                                                                                              |
| File Format    | [Excel](https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-xls/cd03cb5f-ca02-4934-a391-bb674cb8aa06) |
| Data Format    | [Tables](/docs/specifications/category-table)                                                                       |
| Supported APIs | `load`, `parse`                                                                                                     |

## ExcelLoader

`ExcelLoader` loads Excel worksheets as loaders.gl row tables.

## Usage

```typescript
import {ExcelLoader} from '@loaders.gl/excel';
import {load} from '@loaders.gl/core';

const data = await load(url, ExcelLoader, {excel: options});
```

## ExcelArrowLoader

`ExcelArrowLoader` loads Excel worksheets as loaders.gl `ArrowTable` objects that wrap Apache Arrow tables.

```typescript
import {load} from '@loaders.gl/core';
import {ExcelArrowLoader} from '@loaders.gl/excel';

const table = await load(url, ExcelArrowLoader, {excel: options});

const zipCodeColumn = table.data.getChild('zip_code');
const firstZipCode = zipCodeColumn?.get(0);
```

`ExcelArrowLoader` supports the same file formats and options as `ExcelLoader`, but converts the parsed worksheet rows into an Apache Arrow table. Use `ExcelArrowLoader` when the consumer prefers columnar Apache Arrow data over object-row tables.

## Options

| Option        | Type             | Default | Description                                       |
| ------------- | ---------------- | ------- | ------------------------------------------------- |
| `excel.sheet` | `string \| null` | `null`  | Which worksheet to load. Defaults to first sheet. |

## Attribution

The Excel loaders wrap [`SheetJS`](https://github.com/SheetJS/sheetjs), which is Apache 2.0 licensed.
