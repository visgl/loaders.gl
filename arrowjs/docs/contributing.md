# Contributing

This page contains information for Arrow JS contributors.

## API Design Notes

Understanding some of the design decisions made when defining the JavaScript binding API may help facilitate a better appreciateion of why the API is designed the way it is:

- To facilitate keeping the evolution of the JavaScript bindings matched to other bindings, the JavaScript Arrow API is designed to be close match to the C++ Arrow API, although some differences have been made where it makes sense. Some design patterns, like the way `RecordBatchReader.from()` returns different `RecordBatchReader` subclasses depending on what source is being read.


## Editing Documentation

### Markdown vs JSDoc

Since the Arrow JavaScript API includes both manually written markdown and "automatically" generated jsdoc. Some main differences are:

- The markdown version contains a "Developer Guide" which is not present in the jsdoc.
- The markdown version of the "API reference" focuses on readability. It contains more text with semantic descriptions and examples of usage of classes and functions. It also omits more complex typescript annotions for function prototypes to ensure that the API documentation is easy to digest for all JavaScript programmers.
- The jsdoc version includes the full Typescript type information and is more richly hyperlinked and can be valuable to developers as a supplement to the markdown reference when those particular details matter.

### Updating Docs

In general, the markdown docs should be considered the source of truth for the JavaScript API:

* To avoid excessive duplication and possible divergence between markdown and JSDoc, it is recommended that the JSDoc version contains brief summary texts only.
* Reviewers should make sure that PRs affecting the JS API (bothk features and bug fixes) contain appropriate changes to the markdown docs (in the same way that such PRs must contain appropriate changes to e.g. test cases).
* When appropriate, to ensure the markdown docs remain "the source of truth" for the Arrow JS API, bugs should be reviewed first towards the markdown documentation, e.g. to see if the documented behavior is incorrectly specified and needs to be fixed.
