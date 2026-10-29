Format reference

# Understand the file before choosing the loader.

These format notes explain what a file stores, how its versions evolved, and which constraints matter in practice. Use them with the module and API pages when you need both format context and implementation details.

[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Browse documentation](https://loaders.gl/next/docs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs.md)[Standards guide](https://loaders.gl/next/docs/developer-guide/standards.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/standards.md)

How to read a format note

## Start broad, then follow the implementation boundary.

Format articles focus on the format itself: purpose, layout, features, versions, and examples. The linked module and loader pages explain how loaders.gl maps that format into application data.

01

Overview

What problem the format is designed to solve

02

Features

Fields, metadata, encodings, and compression

03

Versions

Important revisions and compatibility context

04

Implementation

Follow module pages for loaders.gl support details

Detailed guide

## Format article conventions

The guidance below explains the intended structure, scope, caveats, and contribution expectations for format documentation.

Format pages answer a different question from API pages: what does the file or protocol represent, and what should a reader know before choosing an implementation?

| You want to…                             | Use…                                      |
| ---------------------------------------- | ----------------------------------------- |
| Understand a file's purpose and layout   | A format article in this section          |
| Load or write that format in JavaScript  | The linked loaders.gl module page         |
| Check a function, option, or return type | The module's API reference                |
| Compare related formats                  | The relevant category or data-plane guide |

## What a format article covers[​](#what-a-format-article-covers "Direct link to What a format article covers")

Articles usually begin with links to the relevant specification and loaders.gl module, then move through the format's purpose, physical or logical layout, important features, versions, and a small example when one makes the structure easier to see. The goal is a useful orientation, not a complete replacement for the normative specification.

Loaders.gl support notes may appear in a clearly labeled column or section. They describe the implementation boundary and should not be read as part of the format specification. For API behavior, follow the module and loader links instead.

Support tables use ✅ for supported capabilities, ⚠️ for partial or experimental support, and ❌ for unsupported capabilities, including planned work that is not available yet. Each marker applies to the scope named in its row and column; read the accompanying limits. “Not applicable” entries are kept separate from unsupported features.

## Scope and contributions[​](#scope-and-contributions "Direct link to Scope and contributions")

This collection is selective. Some articles are concise research notes, while others document a format in more depth; there is no promise that every supported format has a matching article. Corrections and focused additions are welcome, especially when they improve accuracy, clarify a version distinction, or connect a format to the right loaders.gl entry point.
