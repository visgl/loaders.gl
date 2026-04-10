# Usability Feedback

As loaders.gl and the rest of the vis.gl / Open Visualization frameworks increase their usage of Arrow JS, we are facing some challenges with the library.
This can be considered an open letter of feedback to Arrow JS maintainers.

## General packaging and documentation

- **Semver** - Conforming to semantic versioning (semver) conventions would be a big improvement. Depending on a specific arrowjs version in a vis.gl project is hard as there will soon be a new major version. We need to identify ranges of major versions that are likely to work starting from the last breaking version.
- **Arrow JS release notes** - Solid clean arrowjs release notes written for an end user would help a lot. loaders.gl maintains a page that tries to make sense of the commit lists but keeping it current is a challenge.
- **Roadmap info** - when breaking changes are being worked on
- **Upgrade guides** -
- **Updated docs** - Arrow JS docs on web are outdated. It’s hard enough for the vis.gl maintainers to learn the api, docs are not been great for e.g average vis.gl user audience.

## Feature wish list

This set of features are perhaps more specific to the usage patterns in the vis.gl frameworks, but still could be general improvements to the library.

### Pure JS representation of parsed Arrow data.

loaders.gl's philosophy is to return pure JavaScript structures, rather than classes.
The Arrow JS type system (schemas etc could be represented in this way, in fact loaders.gl maintains such an alternative representation).
This reduces the need for serialization and deserialization.
Having a helper class that can be instantiated on top of the pure data structure is of course fine.

TBA...
