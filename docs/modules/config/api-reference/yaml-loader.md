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

Anchors can be declared in block mappings. Aliases to previously declared anchors
work in both block mappings and flow collections. An unquoted `<<` mapping key
merges one mapping or a sequence of mappings; earlier mappings in a sequence take
precedence. Explicit keys override merged values regardless of their position.
`uniqueKeys: true` rejects repeated explicit keys, not explicit overrides of merged
values. A quoted `"<<"` is a literal key, not a merge directive.
