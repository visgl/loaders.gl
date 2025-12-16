# JSONPath

loaders.gl implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535) to keep the streaming parser small. JSONPaths are only used to identify which array to stream, so selectors that address individual array elements are accepted only when they appear at the end of the path and are normalized to the parent array.

| Feature | Example | Supported | Notes |
| --- | --- | --- | --- |
| Root selector | `$` | ✅ | Must always be present. |
| Child name (dot) | `$.features` | ✅ | Names must be valid identifier tokens; use bracket form for other names. |
| Child name (quoted bracket) | `$['feature-name']` | ✅ | Supports single or double quotes with backslash escapes. |
| Array wildcard or slice at the end | `$.features[*]`, `$.features[:]`, `$.features[0:10]`, `$.features.*` | ✅ | Treated as selecting the entire array; additional selectors after an array element selector are not supported. |
| Descendant operator | `$.store..book` | ❌ | Not supported. |
| Array index selector | `$.features[0]` | ❌ | Not supported; use array wildcards to stream the array. |
| Unions | `$.features[0,1]`, `$['a','b']` | ❌ | Not supported. |
| Filters | `$.features[?(@.type == 'road')]` | ❌ | Not supported. |
| Script expressions | `$.features[(@.length-1)]` | ❌ | Not supported. |
| Current node selector | `@` | ❌ | Not supported. |

When a path ends with an array wildcard or slice, loaders.gl normalizes it to the parent array path. For example, `$.features[*]` and `$.features[:]` are treated the same as `$.features` when matching streaming batches.
