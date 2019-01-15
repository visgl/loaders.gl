# RFCs and Roadmaps (loaders.gl)

Implementation of non-trivial new luma.gl features should typically be started off with the creation of an RFC (Request for Comments). For more details see [RFC Guidelines](../RFC-GUIDELINES.md) .


## Roadmaps

Writeups of directions in major areas of interest

| Roadmap                                 | Description |
| ---                                     | ---         |
| N/A                                     | TBD |


## v1.0 RFCs

Current direction for loaders.gl v1.0 is to focus on:

* **API Unification** - Ensure loaders in the same category load similar format data, reducing burden on apps.
* **Off-Thread Loading** - System making it easy to move loading (and post-processing?) off-thread.
* **Module Structure** - reasonable split to avoid bundling unnecessary code

| RFC | Author | Status | Description |
| --- | ---    | ---    | ---         |
| [**loaders.gl Module Structure**](v1.0/module-structure-rfc.md) | @ibgreen | **Draft** | Proposes npm module structure to group similar loader and reduce dependency size/bloat. |
| [**New Loaders Module**](v6.1/loader-module-rfc.md) | @ibgreen | **Implemented** | New loaders.gl submodule collecting framework-agnostic, thread-capable 3D format loaders. Note: This was initially an RFC in luma.gl |
