---
title: Contributing to Arrow JS documentation
description: Keep the readable Arrow JS guides and generated API references aligned as the library evolves.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS documentation"
  title="Keep the human explanation and the API surface in sync."
  description="Arrow JS documentation has a readable guide layer and a generated type reference. This page records how contributors should change them without letting the two descriptions drift apart."
  tone="cyan"
  meta={['Documentation workflow', 'Markdown and JSDoc', 'API design notes']}
  links={[
    {label: 'Arrow JavaScript', to: '/docs/arrowjs'},
    {label: 'Arrow JS upgrade guide', to: '/docs/arrowjs/upgrade-guide'},
    {label: 'Contributing', to: '/docs/arrowjs/contributing'}
  ]}
/>

<DocOrientation
  eyebrow="The documentation contract"
  title="Explain the behavior once, then expose it at the right level."
  description="Markdown should help an application developer understand the model and common workflows. Generated API pages should provide complete types and links for readers who need the exact surface."
  tone="cyan"
  items={[
    {label: 'Design', value: 'Keep JavaScript APIs close to the cross-language Arrow model'},
    {label: 'Guide', value: 'Use prose and examples for the common path'},
    {label: 'Reference', value: 'Let generated docs carry complete TypeScript detail'},
    {label: 'Review', value: 'Update behavior and documentation together'}
  ]}
/>

<ReferenceBoundary
  title="Contribution guidelines"
  description="The sections below cover API design context, the distinction between Markdown and JSDoc, and the review expectations for documentation changes."
  tone="cyan"
/>

This page contains information for Arrow JS contributors.

## API Design Notes

Understanding some of the design decisions made when defining the JavaScript binding API can make it
easier to review why the API is shaped the way it is:

- To keep the JavaScript bindings aligned with the other Arrow implementations, the JavaScript API
  stays close to the C++ API where that is practical. Some JavaScript-specific differences are
  intentional, such as `RecordBatchReader.from()` returning a reader subclass that matches the
  source being read.

## Editing Documentation

### Markdown vs JSDoc

Since the Arrow JavaScript API includes both manually written markdown and "automatically" generated jsdoc. Some main differences are:

- The markdown version contains a "Developer Guide" which is not present in the jsdoc.
- The Markdown version of the API reference focuses on readability. It contains semantic
  descriptions and examples for classes and functions, and omits complex TypeScript annotations
  when they would make the page harder to scan.
- The jsdoc version includes the full Typescript type information and is more richly hyperlinked and can be valuable to developers as a supplement to the markdown reference when those particular details matter.

### Updating Docs

In general, the markdown docs should be considered the source of truth for the JavaScript API:

- To avoid excessive duplication and possible divergence between markdown and JSDoc, it is recommended that the JSDoc version contains brief summary texts only.
- Reviewers should make sure that PRs affecting the JS API, including features and bug fixes,
  update the Markdown docs when behavior or the supported workflow changes. Documentation should
  be reviewed alongside the corresponding tests.
- When appropriate, to ensure the markdown docs remain "the source of truth" for the Arrow JS API, bugs should be reviewed first towards the markdown documentation, e.g. to see if the documented behavior is incorrectly specified and needs to be fixed.
