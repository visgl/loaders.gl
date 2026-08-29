---
title: File formats
description: Read approachable format notes alongside the loaders.gl module and API documentation.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Format reference"
  title="Understand the file before choosing the loader."
  description="These format notes explain what a file stores, how its versions evolved, and which constraints matter in practice. Use them with the module and API pages when you need both format context and implementation details."
  tone="orange"
  meta={['Format overviews', 'Versions and features', 'Module links']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'Browse documentation', to: '/docs'},
    {label: 'Standards guide', to: '/docs/developer-guide/standards'}
  ]}
/>

<DocOrientation
  eyebrow="How to read a format note"
  title="Start broad, then follow the implementation boundary."
  description="Format articles focus on the format itself: purpose, layout, features, versions, and examples. The linked module and loader pages explain how loaders.gl maps that format into application data."
  tone="orange"
  items={[
    {label: 'Overview', value: 'What problem the format is designed to solve'},
    {label: 'Features', value: 'Fields, metadata, encodings, and compression'},
    {label: 'Versions', value: 'Important revisions and compatibility context'},
    {label: 'Implementation', value: 'Follow module pages for loaders.gl support details'}
  ]}
/>

<ReferenceBoundary
  title="Format article conventions"
  description="The guidance below explains the intended structure, scope, caveats, and contribution expectations for format documentation."
  tone="orange"
/>

Format pages answer a different question from API pages: what does the file or protocol represent,
and what should a reader know before choosing an implementation?

| You want to… | Use… |
| --- | --- |
| Understand a file's purpose and layout | A format article in this section |
| Load or write that format in JavaScript | The linked loaders.gl module page |
| Check a function, option, or return type | The module's API reference |
| Compare related formats | The relevant category or data-plane guide |

## What a format article covers

Articles usually begin with links to the relevant specification and loaders.gl module, then move
through the format's purpose, physical or logical layout, important features, versions, and a small
example when one makes the structure easier to see. The goal is a useful orientation, not a complete
replacement for the normative specification.

Loaders.gl support notes may appear in a clearly labeled column or section. They describe the
implementation boundary and should not be read as part of the format specification. For API
behavior, follow the module and loader links instead.

## Scope and contributions

This collection is selective. Some articles are concise research notes, while others document a
format in more depth; there is no promise that every supported format has a matching article.
Corrections and focused additions are welcome, especially when they improve accuracy, clarify a
version distinction, or connect a format to the right loaders.gl entry point.
