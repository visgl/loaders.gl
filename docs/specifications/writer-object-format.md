# Writer Object

To be compatible with `@loaders.gl/core` functions such as `encode`, writer objects need to conform to the following specification:

### Common Fields

| Field       | Type     | Default  | Description                                                     |
| ----------- | -------- | -------- | --------------------------------------------------------------- |
| `name`      | `String` | Required | Short name of the loader ('OBJ', 'PLY' etc)                     |
| `extension` | `String` | Required | Three letter (typically) extension used by files of this format |
| `category`  | `String` | Optional | Indicates the type/shape of data                                |

### Encoder Function

| Field                            | Type       | Default | Description                                            |
| -------------------------------- | ---------- | ------- | ------------------------------------------------------ |
| `encodeSync`                     | `Function` | `null`  | Encodes synchronously                                  |
| `encode`                         | `Function` | `null`  | Encodes asynchronously                                 |
| `encodeInBatches` (Experimental) | `Function` | `null`  | Encodes and releases batches through an async iterator |

Note: The format of the input data to the encoders depends on the loader. Several loader categories are defined to provided standardized data formats for similar loaders.
