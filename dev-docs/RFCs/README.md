# RFCs and Roadmaps (loaders.gl)

Implementation of non-trivial new features should typically be started off with the creation of an RFC (Request for Comments). For more details see [RFC Guidelines](../RFC-GUIDELINES.md) .

## Roadmaps

Writeups of directions in major areas of interest

| Roadmap | Description |
| ------- | ----------- |
| N/A     | TBD         |

## v2.0 RFCs

| RFC                                                             | Author   | Status          | Description                                                                                                                          |
| --------------------------------------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [****](v2.0/json-support-rfc.md)             | @ibgreen | **Draft**       | Integrated support for JSON formats         |
| [****](v2.0/loader-auto-detection-rfc.md)    | @ibgreen | **Draft**       | Improved support for loader auto detection         |
| [****](v2.0/loader-auto-registration-rfc.md) | @ibgreen | **Draft**       | Loader auto registration  at import         |
| [****](v2.0/loader-lookup-by-namerfc.md)            | @ibgreen | **Draft**       | Loader lookup among pre-registered loaders        |


## v1.0 RFCs

| RFC                                                             | Author   | Status          | Description                                                                                                                          |
| --------------------------------------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [**loaders.gl Module Structure**](v1.0/module-structure-rfc.md) | @ibgreen | **Draft**       | Proposes npm module structure to group similar loader and reduce dependency size/bloat.                                              |
| [**New Loaders Module**](v1.0/loader-module-rfc.md)             | @ibgreen | **Implemented** | New loaders.gl submodule collecting framework-agnostic, thread-capable 3D format loaders. Note: This was initially an RFC in luma.gl |

loaders.gl v1.0 focused on:

- **API Unification** - Ensure loaders in the same category load similar format data, reducing burden on apps.
- **Off-Thread Loading** - System making it easy to move loading off-thread.
- **Module Structure** - reasonable split to avoid bundling unnecessary code