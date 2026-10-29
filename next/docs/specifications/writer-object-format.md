Writer contract

# Make the output boundary as clear as the input.

A writer object identifies its output format and exposes synchronous, asynchronous, or batched encoding functions. Applications can choose the writer without learning its internal codec.

[Creating writers](https://loaders.gl/next/docs/developer-guide/creating-loaders-and-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/creating-loaders-and-writers.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

The writer boundary

## Declare the output. Encode the compatible shape.

Writer metadata describes the physical encoding and logical format. The encoder then accepts the category data defined by that format and returns bytes or batches for storage.

01

Identify

Name, extension, category, and format

02

Encode

Synchronous or asynchronous output

03

Stream

Release encoded batches incrementally

04

Compose

Share category data with compatible writers

To be compatible with `@loaders.gl/core` functions such as `encode`, writer objects need to conform to the following specification:

Detailed guide

## Writer fields and encoder functions

The sections below define common metadata, synchronous and asynchronous encoders, batched output, and category-data compatibility.

### Common fields[​](#common-fields "Direct link to Common fields")

| Field        | Type                | Purpose                                 |
| ------------ | ------------------- | --------------------------------------- |
| `id`         | `string`            | Writer identifier and option namespace. |
| `name`       | `string`            | Human-readable writer name.             |
| `module`     | `string`            | Owning loaders.gl module.               |
| `version`    | `string`            | Version used for runtime assets.        |
| `extensions` | `string[]`          | Output extensions without leading dots. |
| `options`    | `object`            | Default writer options.                 |
| `mimeTypes`  | `string[]`          | Optional output MIME types.             |
| `category`   | `string`            | Optional accepted data category.        |
| `encoding`   | `string`            | Optional physical serialization.        |
| `format`     | `string`            | Optional logical format.                |
| `worker`     | `boolean \| string` | Optional worker descriptor.             |

`text` and `binary` remain compatibility hints used by encoding helpers. Check the writer reference for accepted input shapes and supported output methods.

### Encoder Function[​](#encoder-function "Direct link to Encoder Function")

| Field                            | Type       | Default | Description                                            |
| -------------------------------- | ---------- | ------- | ------------------------------------------------------ |
| `encodeSync`                     | `Function` | `null`  | Encodes synchronously                                  |
| `encode`                         | `Function` | `null`  | Encodes asynchronously                                 |
| `encodeInBatches` (Experimental) | `Function` | `null`  | Encodes and releases batches through an async iterator |

Note: The format of the input data to the encoders depends on the writer. Category contracts provide shared data shapes, but each writer defines which representations it accepts.
