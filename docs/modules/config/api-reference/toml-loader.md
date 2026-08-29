# TOMLLoader

`TOMLLoader` parses TOML configuration documents into JavaScript objects, arrays, dates, and scalar
values.

| Loader | Value |
| --- | --- |
| File extension | `.toml` |
| Media type | `application/toml` |
| Data format | TOML document |
| Supported APIs | `load`, `parse`, `parseSync` |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {TOMLLoader} from '@loaders.gl/config/bundled';

const data = await load('config.toml', TOMLLoader);
```

Parser options are passed as `options.toml`. The options include BigInt handling for large integer
values and a maximum nesting-depth setting.
