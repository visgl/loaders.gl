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

This section collects articles that provide additional information about a number of the file formats supported by loaders.gl.

Note that these file format articles are essentially a cleaned up collection of research notes for some of the formats supported by loaders.gl. They are not intended to be comprehensive or exhaustive. The hope is that by sharing these notes we may help some readers quickly build deeper understanding of a particular format, by providing a high level, easily digestible summary of the key points of that format.

## Documentation Structure

The file format articles in this section aim to follow the following structure:

- **Links** -Articles should start off with links to the loaders.gl module that implements this format, as well as specifications and if available, the corresponding wikipedia article.
- **Overview** of formats - what is the purpose of the format?
- **Features** details about what is stored in the format (columns, metadata, data types, encodings, compressions, ...).
- **Versions** - if the format has undergone notable revisions, it is desirable to have a section about what these are and what changed between releases. It is good to be able to show when the versions were standardized to place them in context of the evolution of file formats.
- **Example** - Especially for textual formats it is often illustrative to show a short example file.

The preference is that file format articles should focus on the format itself and avoid describing the loaders.gl API. The articles can then be relevant for a bigger audience, and loaders.gl API information can be concentrated into the reference docs.

However for practical reasons some information showing loaders.gl support for various file format features may be included. For example, an extra loaders.gl specific column can occasionally found in tables listing out format features, indicating if those features are supported in loaders.gl. The information should so that it is clearly marked and can easily be ignored.

## Caveats

The documentation in this "Formats" section are provided on an as-is basis, there is no currently no stated goal of provide similar documentation for all covered formats. Requesting maintainers to write new articles or update existing articles will likely not be successful. That said, egregious errors will be fixed if reported. GitHub Pull Requests with corrections or additional contributions are welcome, as long the proposed changes are reasonably consistent with the general style and level detail of the existing documentation.
