# YAMLLoader

`YAMLLoader` parses YAML documents into JavaScript objects, arrays, and scalar values. It supports
both `.yaml` and `.yml` extensions.

| Loader | Value |
| --- | --- |
| File extensions | `.yaml`, `.yml` |
| Media type | `application/yaml`, `text/yaml` |
| Data format | YAML document |
| Supported APIs | `load`, `parse`, `parseSync` |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {YAMLLoader} from '@loaders.gl/config/bundled';

const data = await load('config.yaml', YAMLLoader);
```

For synchronous text parsing:

```typescript
const data = YAMLLoader.parseTextSync?.('enabled: true');
```

Parser options are passed as `options.yaml`. The options include YAML version selection, BigInt
integer parsing, string-key enforcement, and duplicate-key checking.
