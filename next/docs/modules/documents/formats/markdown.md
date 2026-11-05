Document format

[MD](https://loaders.gl/next/docs/modules/documents/formats/markdown.md)

# Markdown

Read headings, prose, lists, links, and fenced code as structured data, without bringing a renderer into your application.

[MarkdownLoader](https://loaders.gl/next/docs/modules/documents/api-reference/markdown-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents/api-reference/markdown-loader.md)[Documents module](https://loaders.gl/next/docs/modules/documents.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/documents.md)

## loaders.gl support[​](#loadersgl-support "Direct link to loaders.gl support")

| Type   | API                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Loader | [`MarkdownLoader`](https://loaders.gl/next/docs/modules/documents/api-reference/markdown-loader.md) |

Markdown is a lightweight markup syntax for readable text documents. `MarkdownLoader` supports a small, documented subset and returns a rendering-independent tree. It does not claim full CommonMark compliance. See the [loader reference](https://loaders.gl/next/docs/modules/documents/api-reference/markdown-loader.md) for supported syntax, output nodes, and limitations.

| Feature                 | Support                                                   |
| ----------------------- | --------------------------------------------------------- |
| Headings and paragraphs | ATX headings and soft line breaks                         |
| Lists and quotes        | Flat, single-line items and nested blockquotes            |
| Code                    | Fenced blocks and inline spans                            |
| Inline markup           | Emphasis, strong text, links, images, punctuation escapes |
| Rendering               | Application-owned; raw HTML and URLs remain data          |
| Advanced dialects       | No tables, MDX, reference links, or CommonMark guarantee  |
