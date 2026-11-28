# RFC: Schema inference for dynamically typed table loaders

**Status**: Implemented for CSV and JSON table inference

JSONTableSource proposes a choice between full-document inference and bounded first-batch inference in [#4667](https://github.com/visgl/loaders.gl/pull/4667). CSV presents the same tradeoff, but its entry points currently sample different amounts of input. Whole-file Arrow parsing can inspect the full table, streaming Arrow freezes types from its first batch, and CSV source metadata reads the first schema emitted by the row parser, which normally infers from one record.

## Proposed contract

Expose the same named policy on format options for loaders and sources that support both modes.

```ts
type TableSchemaInference = 'full' | 'first-batch';

const streamingCSV = {csv: {schemaInference: 'first-batch'}} as const;
const heterogeneousJSON = {json: {schemaInference: 'full'}} as const;
```

| Policy | Inference input | When results can start |
| --- | --- | --- |
| `full` | All logical records before projection, filtering, offset, and limit | After inference reaches the end of the input |
| `first-batch` | A bounded prefix of logical records before projection, filtering, offset, and limit | As soon as the prefix is complete, or at EOF for shorter inputs |

Use a deterministic prefix, initially up to 1,024 records, consistent with the JSON source proposal. Count parsed records after format-level normalization. For CSV, exclude the header and skipped comments and blank lines. A smaller explicit output batch size also caps the sample. With the same options, byte chunk boundaries and worker execution do not affect inference. A supplied schema takes precedence when the format accepts one. CSV with dynamic typing disabled retains text storage.

First-batch inference freezes column types once. Later values follow the format's documented conversion rules. A loader must document how it represents incompatible values and additional fields. Source metadata discovery and data reads must use the same inference policy so consumers can prepare a query against the schema they will read.

Default to `first-batch` for CSVLoader and JSONTableLoader streaming reads and for CSVTableSource and JSONTableSource schema discovery and scans so callers get bounded startup and can stop at a row limit without reading the entire input. Applications with heterogeneous or unstructured tables can opt into `full` to account for fields and types that appear late. Whole-file parse APIs may retain `full` as their default because they already receive the complete input. Explicit options have the same semantics through either entry point.

Changing a source that previously defaulted to full inference can narrow the reported schema and change how late rows are converted. Document the migration and show how to select `full` before changing that default. Full inference on a forward-only stream may require buffering or replay. Source capabilities should reflect the resulting latency, and metadata discovery and reads should remain cancellable.

## Adoption

1. Share the TypeScript option type after the JSON policy lands. Apply it to CSVLoader and CSVTableSource, including row and Arrow output, with format-specific documentation for late values. Reuse CSV's existing typed Arrow inference and geometry normalization where they fit the contract.
2. Verify parity for explicit policies in atomic and streaming reads, standalone and worker execution, and CSV source metadata. Cover short input, headers, comments, quoted multiline cells, late conflicting types, and cancellation at a row limit. Use the same input with different byte chunk sizes and output batch sizes.
3. Evaluate NDJSON next. Its records are independently framed, but callers still need agreement on type changes and late fields. Formats with declared schemas keep their existing behavior.
