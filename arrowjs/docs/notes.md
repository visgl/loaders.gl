# Notes on Documentation

## Markdown vs JSDoc

Since the Arrow JavaScript API includes both manually written markdown and "automatically" generated jsdoc.

- The markdown version contains a "Developer Guide".
- The markdown version of the "API reference" focuses on readability. It contains more textual descriptions of classes and functions, and it does not include complex typescript annotions for function prototypes to ensure that the API documentation is easy to digest for all JavaScript programmers.
- The jsdoc version includes the full Typescript type information and is more richly hyperlinked and can be worth perusing when those details matter.

## Updating Docs

In general, the markdown docs should be considered the source of truth for the JavaScript API:

* To avoid excessive duplication and possible divergence between markdown and JSDoc, it is recommended that the JSDoc version contains brief summary texts only.
* Reviewers should make sure that PRs affecting the JS API (bothk features and bug fixes) contain appropriate changes to the markdown docs (in the same way that such PRs must contain appropriate changes to e.g. test cases).
* When appropriate, to ensure the markdown docs remain "the source of truth" for the Arrow JS API, bugs should be reviewed first towards the markdown documentation, e.g. to see if the documented behavior is incorrectly specified and needs to be fixed.
