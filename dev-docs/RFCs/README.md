# RFCs and Roadmaps (loaders.gl)

Implementation of non-trivial new features should typically be started off with the creation of an RFC (Request for Comments). For more details see [RFC Guidelines](../RFC-GUIDELINES.md) .

## Roadmaps

Writeups of directions in major areas of interest

| Roadmap | Description |
| ------- | ----------- |
| N/A     | TBD         |

## Longer-Term RFCs

| RFC                                                                   | Author   | Status    | Description                                                 |
| --------------------------------------------------------------------- | -------- | --------- | ----------------------------------------------------------- |
| [**MIME type support**](vNext/mime-type-support-rfc.md)               | @ibgreen | **Draft** | Support for MIME types                                      |
| [**JSON**](vNext/json-support-rfc.md)                                 | @ibgreen | **Draft** | Core support for JSON formats                               |
| [**File System**](vNext/file-system-rfc.md)                           | @ibgreen | **Draft** | `fetch`-ing from "virtual file systems" (Zip, Dropbox, ...) |
| [**Loader Lookup By Name**](vNext/loader-lookup-by-name-rfc.md)       | @ibgreen | **Draft** | Loader lookup among pre-registered loaders                  |
| [**Loader Auto-Registration**](vNext/loader-auto-registration-rfc.md) | @ibgreen | **Draft** | Loader auto registration at import                          |

## v2.0 RFCs

| RFC                                                            | Author   | Status          | Description                                   |
| -------------------------------------------------------------- | -------- | --------------- | --------------------------------------------- |
| [**Streaming JSON Loader**](v2.0/json-loader-rfc.md)           | @ibgreen | **Draft**       | Binary, streaming, worker-enabled JSON loader |
| [**Fetch Options**](v2.0/fetch-option-rfc.md)                  | @ibgreen | **Draft**       | Options for `fetch`                           |
| [**Loader Options**](v2.0/loader-options-rfc.md)               | @ibgreen | **Implemented** | Nested options scheme for loaders             |
| [**Loader Auto-Detection**](v2.0/loader-auto-detection-rfc.md) | @ibgreen | **Implemented** | Improved support for loader auto detection    |
| [**Remove Load-and-Parse**](v2.0/remove-load-and-parse-rfc.md) | @ibgreen | **Implemented** | All loaders now use `fetch` to retrieve data  |

## v1.0 RFCs

| RFC                                                             | Author   | Status          | Description                                                                                                                          |
| --------------------------------------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [**loaders.gl Module Structure**](v1.0/module-structure-rfc.md) | @ibgreen | **Implemented** | Proposes npm module structure to group similar loader and reduce dependency size/bloat.                                              |
| [**New Loaders Module**](v1.0/loader-module-rfc.md)             | @ibgreen | **Implemented** | New loaders.gl submodule collecting framework-agnostic, thread-capable 3D format loaders. Note: This was initially an RFC in luma.gl |

loaders.gl v1.0 focused on:

- **API Unification** - Ensure loaders in the same category load similar format data, reducing burden on apps.
- **Off-Thread Loading** - System making it easy to move loading off-thread.
- **Module Structure** - reasonable split to avoid bundling unnecessary code
