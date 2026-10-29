Arrow JS · maintainers' notes

# Make the columnar model easier to adopt.

These notes collect the Arrow JS packaging, documentation, and API improvements that would make it easier for applications such as loaders.gl to use the library across browsers, workers, and Node.js.

[Arrow JavaScript](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Upgrade guide](https://loaders.gl/next/docs/arrowjs/upgrade-guide.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/upgrade-guide.md)[Contributing](https://loaders.gl/next/docs/arrowjs/contributing.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/contributing.md)

Where the friction is

## The data model is strong; the edges should be easier.

The suggestions below focus on the boundaries where application developers spend time: selecting a compatible version, finding the right guide, moving data between runtimes, and using familiar JavaScript structures.

01

Packages

Predictable semver and release notes

02

Docs

Current guides written for application developers

03

Interop

Reliable browser, worker, and Node.js boundaries

04

Data

A clear pure-JavaScript representation when needed

Detailed guide

## Usability feedback

The sections below are design and ecosystem feedback, not a promise that every item belongs in the Arrow specification or in loaders.gl itself.

As loaders.gl and the rest of the vis.gl and Open Visualization frameworks use Arrow JS more widely, the boundaries around packaging, documentation, and JavaScript ergonomics become increasingly important. These notes are intended as concrete feedback for Arrow JS maintainers.

## General packaging and documentation[​](#general-packaging-and-documentation "Direct link to General packaging and documentation")

* **Semver** - Conforming to semantic versioning (semver) conventions would be a big improvement. Depending on a specific arrowjs version in a vis.gl project is hard as there will soon be a new major version. We need to identify ranges of major versions that are likely to work starting from the last breaking version.
* **Arrow JS release notes** - Solid clean arrowjs release notes written for an end user would help a lot. loaders.gl maintains a page that tries to make sense of the commit lists but keeping it current is a challenge.
* **Roadmap info** - when breaking changes are being worked on
* **Upgrade guides** -
* **Updated docs** - Arrow JS web documentation can be difficult to navigate. The maintainers need accurate API guidance, and the average application developer needs a clear path through the same concepts.

## Feature wish list[​](#feature-wish-list "Direct link to Feature wish list")

These ideas are informed by vis.gl usage patterns, but could also be useful improvements for the wider JavaScript ecosystem.

### Pure JS representation of parsed Arrow data.[​](#pure-js-representation-of-parsed-arrow-data "Direct link to Pure JS representation of parsed Arrow data.")

loaders.gl's philosophy is to return pure JavaScript structures, rather than classes. The Arrow JS type system (schemas etc could be represented in this way, in fact loaders.gl maintains such an alternative representation). This reduces the need for serialization and deserialization. Having a helper class that can be instantiated on top of the pure data structure is of course fine.

The pure-JavaScript representation remains a design direction rather than a proposed change to the Arrow JS object model. In loaders.gl, serialized table helpers and focused transport APIs provide a practical boundary today; future Arrow JS work should preserve the ability to move typed buffers without forcing applications to learn an additional object graph.
