# MarkdownLoader

Loads UTF-8 Markdown into a `MarkdownDocument` syntax tree, without a renderer or UI dependency.

```typescript
import {parse} from '@loaders.gl/core';
import {MarkdownLoader} from '@loaders.gl/documents';

const document = await parse('# Title\n\nA **bold** statement.', MarkdownLoader);
```

For synchronous parsing, import `MarkdownLoaderWithParser` from
`@loaders.gl/documents/markdown-loader` and use `parseSync`.

| Property | Value |
| --- | --- |
| Extensions | `.md`, `.markdown` |
| MIME type | `text/markdown` |
| Input | UTF-8 bytes or text |
| Output | `MarkdownDocument` |
| Worker | No |

## Options

`options.markdown.maxDepth` bounds nested quotes and inline markup. It defaults to `32` and must
be an integer from `1` to `128`, including the root level. Exceeding the limit throws an error.

## Output

The root is `{type: 'root', children: MarkdownBlock[]}`. Blocks include headings (`depth` and
inline `children`), paragraphs (`children`), fenced code (`value` and optional `language`),
flat lists (`ordered`, optional numeric `start`, and inline `items`), blockquotes (`children`),
and thematic breaks. Inline nodes include text and code (`value`), emphasis and strong text
(`children`), links (`url`, `children`), and images (`url`, plain `alt`).

Types are exported from the package root and `/markdown-types`.

## Supported subset

Supports ATX headings, paragraphs, backtick/tilde fences, blockquotes, single-line ordered and
unordered list items, thematic breaks, inline code, emphasis, strong text, inline links/images,
and backslash punctuation escapes. Soft line breaks remain newline characters in text nodes.
Unclosed fences consume the remaining document; unmatched inline delimiters remain literal text.

This is a deliberately small parser, not a CommonMark or mdast implementation. Nested/multiline
lists, setext headings, indented code, reference links, tables, task lists, autolinks, full delimiter
precedence, HTML parsing, and MDX are not supported. Choose a fuller Markdown engine when those
semantics are required.

Raw HTML remains text. Destinations remain authored strings: the parser never fetches links or
images, executes code, or renders HTML. Applications rendering the tree must escape text and
validate URL schemes according to their own policy.
