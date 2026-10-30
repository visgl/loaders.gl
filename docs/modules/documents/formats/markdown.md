---
title: Markdown
description: Simple Markdown documents parsed into a portable syntax tree.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  format="markdown"
  eyebrow="Document format"
  title="Markdown"
  description="Read headings, prose, lists, links, and fenced code as structured data, without bringing a renderer into your application."
  tone="cyan"
  meta={['Text', 'Native parser', 'Syntax tree']}
  links={[
    {label: 'MarkdownLoader', to: '/docs/modules/documents/api-reference/markdown-loader'},
    {label: 'Documents module', to: '/docs/modules/documents'}
  ]}
/>

Markdown is a lightweight markup syntax for readable text documents. `MarkdownLoader` supports
a small, documented subset and returns a rendering-independent tree. It does not claim full
CommonMark compliance. See the [loader reference](/docs/modules/documents/api-reference/markdown-loader)
for supported syntax, output nodes, and limitations.

| Feature | Support |
| --- | --- |
| Headings and paragraphs | ATX headings and soft line breaks |
| Lists and quotes | Flat, single-line items and nested blockquotes |
| Code | Fenced blocks and inline spans |
| Inline markup | Emphasis, strong text, links, images, punctuation escapes |
| Rendering | Application-owned; raw HTML and URLs remain data |
| Advanced dialects | No tables, MDX, reference links, or CommonMark guarantee |
