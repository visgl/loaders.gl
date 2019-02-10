# Writer Object Specification

To be compatible with `@loaders.gl/core` functions, writer objects need to conform to the following specification:

## v1.0 Writer Object

### Common Fields

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `name`          | `String`    | Required   | Short name of the loader ('OBJ', 'PLY' etc) |
| `extension`     | `String`    | Required   | Three letter (typically) extension used by files of this format |
| `category`      | `String`    | Optional   | Indicates the type/shape of data |


### Test Function

| Field           | Type        | Default    | Description |
| ---             | ---         | ---        | ---         |
| `encodeSync`    | `Function`  | `null`     | Encodes synchronously |
| `encode`        | `Function`  | `null`     | Encodes asynchronously |
