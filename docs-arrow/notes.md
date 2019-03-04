# Notes on Documentation


## Markdown vs JSDoc

Since the Arrow JavaScript API includes both manually written markdown and "automatically" generated jsdoc is used for the JS API. Each provides.

- The markdown version focuses on readability.
- The jsdoc version includes Typescript type information and is more richly hyperlinked.

In general, to avoid excessive duplication and possible divergence, it is recommended that the JSDoc version contains brief summary texts only.


## Updating Docs

In general, the markdown docs should be considered a (the?) source of truth for the JavaScript API:

* Reviewers should make sure that PRs affecting the JS API code contain appropriate changes to the markdown docs (in the same way that such PRs must contain appropriate changes to e.g. test cases).
* Bugs should be reviewed first towards the documentation, to see if the documented behavior needs to be changed, and then towards the code.
