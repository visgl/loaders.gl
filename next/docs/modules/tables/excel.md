Excel module

# Bring workbook sheets into a table pipeline.

`@loaders.gl/tables/excel` reads Excel workbooks and exposes their sheet data through the loaders.gl table conventions. It is a boundary adapter for applications that should not need to understand workbook internals.

[Excel loader](https://loaders.gl/next/docs/modules/tables/excel/api-reference/excel-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/excel/api-reference/excel-loader.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

The workbook path

## Open a workbook. Choose a sheet. Process table data.

The loader hides workbook parsing behind a familiar loaders.gl result. Downstream table code can remain separate from the original spreadsheet container.

01

Input

XLSX and supported Excel workbook data

02

Discover

Workbook and sheet structure

03

Select

Sheet and loader-specific options

04

Output

Loaders.gl table data

Detailed guide

## Excel loader details

The reference below covers installation, the loader entry point, workbook handling, and the table category used by the result.

The `@loaders.gl/tables/excel` module handles tabular data stored in the Excel file format.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tables xlsx@^0.18.5
```

`xlsx` is an optional dependency of `@loaders.gl/tables` and is required for Excel parsing. If optional dependencies were omitted or failed to install, install it explicitly. The installation command above includes the required backend.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader                                                                                                            | Description                                 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [`ExcelLoader`](https://loaders.gl/next/docs/modules/tables/excel/api-reference/excel-loader.md#excelloader) | Loads Excel workbooks as loaders.gl tables. |

## Additional APIs[​](#additional-apis "Direct link to Additional APIs")

See the [table category](https://loaders.gl/next/docs/specifications/category-table.md) for output shapes and shared table APIs.
