---
title: JSONPath support
description: Select the array that a streaming JSON loader should visit with a focused RFC 9535-compatible subset.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="JSON module · streaming selection"
  title="JSONPath"
  description="loaders.gl implements the JSONPath features needed to identify a streamable array while keeping parsing small and predictable. The selector describes a path, not a general-purpose query language."
  tone="yellow"
  meta={['RFC 9535 subset', 'Streaming arrays', 'Predictable selectors']}
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'JSONLoader', to: '/docs/modules/json/api-reference/json-loader'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The supported shape"
  title="Select a path; do the filtering in the pipeline."
  description="Root and child selectors identify the array to stream. Terminal wildcards and slices normalize to that parent array; filters, unions, and element traversal are deliberately outside this contract."
  tone="yellow"
  items={[
    {label: 'Root', value: 'Every selector begins with $'},
    {label: 'Children', value: 'Dot or quoted-bracket property names'},
    {label: 'Arrays', value: 'Terminal wildcard or slice selects the parent array'},
    {label: 'Boundary', value: 'No filters, unions, or descendant queries'}
  ]}
/>

<ReferenceBoundary
  title="JSONPath details"
  description="The support matrix below lists the accepted selectors and the deliberate limitations of the streaming parser."
  tone="yellow"
/>

# JSONPath

loaders.gl implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535) to keep the streaming parser small. JSONPaths are only used to identify which array to stream, so selectors that address individual array elements are accepted only when they appear at the end of the path and are normalized to the parent array.

| Feature                            | Example                                                              | Supported | Notes                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| Root selector                      | `$`                                                                  | ✅        | Must always be present.                                                                                        |
| Child name (dot)                   | `$.features`                                                         | ✅        | Names must be valid identifier tokens; use bracket form for other names.                                       |
| Child name (quoted bracket)        | `$['feature-name']`                                                  | ✅        | Supports single or double quotes with backslash escapes.                                                       |
| Array wildcard or slice at the end | `$.features[*]`, `$.features[:]`, `$.features[0:10]`, `$.features.*` | ✅        | Treated as selecting the entire array; additional selectors after an array element selector are not supported. |
| Descendant operator                | `$.store..book`                                                      | ❌        | Not supported.                                                                                                 |
| Array index selector               | `$.features[0]`                                                      | ❌        | Not supported; use array wildcards to stream the array.                                                        |
| Unions                             | `$.features[0,1]`, `$['a','b']`                                      | ❌        | Not supported.                                                                                                 |
| Filters                            | `$.features[?(@.type == 'road')]`                                    | ❌        | Not supported.                                                                                                 |
| Script expressions                 | `$.features[(@.length-1)]`                                           | ❌        | Not supported.                                                                                                 |
| Current node selector              | `@`                                                                  | ❌        | Not supported.                                                                                                 |

When a path ends with an array wildcard or slice, loaders.gl normalizes it to the parent array path. For example, `$.features[*]` and `$.features[:]` are treated the same as `$.features` when matching streaming batches.
