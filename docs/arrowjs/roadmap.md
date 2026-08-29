---
title: Arrow JS usability feedback
description: A practical list of packaging, documentation, and data-model improvements that matter to loaders.gl applications.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS · maintainers' notes"
  title="Make the columnar model easier to adopt."
  description="These notes collect the Arrow JS packaging, documentation, and API improvements that would make it easier for applications such as loaders.gl to use the library across browsers, workers, and Node.js."
  tone="cyan"
  meta={['Packaging', 'Documentation', 'JavaScript ergonomics']}
  links={[
    {label: 'Arrow JavaScript', to: '/docs/arrowjs'},
    {label: 'Upgrade guide', to: '/docs/arrowjs/upgrade-guide'},
    {label: 'Contributing', to: '/docs/arrowjs/contributing'}
  ]}
/>

<DocOrientation
  eyebrow="Where the friction is"
  title="The data model is strong; the edges should be easier."
  description="The suggestions below focus on the boundaries where application developers spend time: selecting a compatible version, finding the right guide, moving data between runtimes, and using familiar JavaScript structures."
  tone="cyan"
  items={[
    {label: 'Packages', value: 'Predictable semver and release notes'},
    {label: 'Docs', value: 'Current guides written for application developers'},
    {label: 'Interop', value: 'Reliable browser, worker, and Node.js boundaries'},
    {label: 'Data', value: 'A clear pure-JavaScript representation when needed'}
  ]}
/>

<ReferenceBoundary
  title="Usability feedback"
  description="The sections below are design and ecosystem feedback, not a promise that every item belongs in the Arrow specification or in loaders.gl itself."
  tone="cyan"
/>

As loaders.gl and the rest of the vis.gl and Open Visualization frameworks use Arrow JS more widely,
the boundaries around packaging, documentation, and JavaScript ergonomics become increasingly
important. These notes are intended as concrete feedback for Arrow JS maintainers.

## General packaging and documentation

- **Semver** - Conforming to semantic versioning (semver) conventions would be a big improvement. Depending on a specific arrowjs version in a vis.gl project is hard as there will soon be a new major version. We need to identify ranges of major versions that are likely to work starting from the last breaking version.
- **Arrow JS release notes** - Solid clean arrowjs release notes written for an end user would help a lot. loaders.gl maintains a page that tries to make sense of the commit lists but keeping it current is a challenge.
- **Roadmap info** - when breaking changes are being worked on
- **Upgrade guides** -
- **Updated docs** - Arrow JS web documentation can be difficult to navigate. The maintainers need
  accurate API guidance, and the average application developer needs a clear path through the same
  concepts.

## Feature wish list

These ideas are informed by vis.gl usage patterns, but could also be useful improvements for the
wider JavaScript ecosystem.

### Pure JS representation of parsed Arrow data.

loaders.gl's philosophy is to return pure JavaScript structures, rather than classes.
The Arrow JS type system (schemas etc could be represented in this way, in fact loaders.gl maintains such an alternative representation).
This reduces the need for serialization and deserialization.
Having a helper class that can be instantiated on top of the pure data structure is of course fine.

TBA...
