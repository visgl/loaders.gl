Excel API · table loader

# Bring worksheets into the same table path.

ExcelLoader reads XLS, XLSB, and XLSX worksheets and returns either row-oriented data or an Arrow-backed table. Choose the shape that matches the next processing or rendering step.

[Excel module](https://loaders.gl/next/docs/modules/tables/excel.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/excel.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)[Apache Arrow guide](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The worksheet path

## Choose rows for convenience or columns for processing.

ExcelLoader keeps worksheet selection and output representation explicit. Object rows are convenient for application code; Arrow output is a better boundary when typed columns will feed scans, transforms, or writers.

01

Input

Excel workbook with one or more worksheets

02

Worksheet

Select a sheet or use the first sheet by default

03

Output

ObjectRowTable or ArrowTable

04

Boundary

Non-streaming loader backed by SheetJS

Detailed guide

## ExcelLoader reference

The sections below document supported file types, output shapes, worksheet selection, options, and the SheetJS implementation boundary.

Non-streaming table loaders for Excel files.

| Loader        | Output                         | Use when                                      |
| ------------- | ------------------------------ | --------------------------------------------- |
| `ExcelLoader` | `ObjectRowTable \| ArrowTable` | You want JavaScript row data or Arrow output. |

| Characteristic | Value                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.xls`, `.xlsb`, `.xlsx`                                                                                            |
| File Type      | Binary                                                                                                              |
| File Format    | [Excel](https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-xls/cd03cb5f-ca02-4934-a391-bb674cb8aa06) |
| Data Format    | [Tables](https://loaders.gl/next/docs/specifications/category-table.md)                                        |
| Supported APIs | `load`, `parse`                                                                                                     |

## ExcelLoader[​](#excelloader "Direct link to ExcelLoader")

`ExcelLoader` loads Excel worksheets as loaders.gl `ArrowTable` objects by default. Set `excel.shape: 'object-row-table'` to request row-table output.

## Installation[​](#installation "Direct link to Installation")

Install `xlsx` to use this API. It is an optional dependency of `@loaders.gl/tables`.

```
npm install @loaders.gl/core @loaders.gl/tables xlsx@^0.18.5
```

For grouped imports, install `@loaders.gl/tables` in place of `@loaders.gl/tables/excel` and keep `xlsx` installed.

## Usage[​](#usage "Direct link to Usage")

```
import {ExcelLoader} from '@loaders.gl/tables/excel';

import {load} from '@loaders.gl/core';



const data = await load(url, ExcelLoader, {excel: options});
```

Load an Excel worksheet as a loaders.gl `ArrowTable` by setting `excel.shape: 'arrow-table'`.

```
import {load} from '@loaders.gl/core';

import {ExcelLoader} from '@loaders.gl/tables/excel';



const table = await load(url, ExcelLoader, {

  excel: {

    ...options,

    shape: 'arrow-table'

  }

});



const zipCodeColumn = table.data.getChild('zip_code');

const firstZipCode = zipCodeColumn?.get(0);
```

## Options[​](#options "Direct link to Options")

| Option        | Type                                                                                                                                                | Default       | Description                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `excel.sheet` | `string \| null`                                                                                                                                    | `null`        | Which worksheet to load. Defaults to first sheet. |
| `excel.shape` | [![Website shields.io](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)](http://shields.io) `'object-row-table' \| 'arrow-table'` | `arrow-table` | Selects row-table output or Apache Arrow output.  |

## Attribution[​](#attribution "Direct link to Attribution")

The Excel loaders wrap [`SheetJS`](https://github.com/SheetJS/sheetjs), which is Apache 2.0 licensed.
