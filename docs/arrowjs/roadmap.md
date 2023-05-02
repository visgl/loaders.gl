# Roadmap

What's Next for Apache Arrow in Javascript

There are a lot of features we'd like to add over the next few Javascript releases:

* **Inline predicates**: Function calls in the inner loop of a scan over millions of records can be very expensive. We can potentially save that time by generating a new scan function with the predicates inlined when a filter is created.

* **Cache filter results**: Right now every time we do a scan on a filtered DataFrame we re-check the predicate on every row. There should be an (optional?) lazily computed index to store the predicate results for subsequent re-use.

* **Friendlier API**: I shouldn't have to write a custom scan function just to take a look at the results of a filter! Every DataFrame should have a toJSON() function (See ARROW-2202).

* **node.js ↔ (Python, C++, Java, ...) interaction**: A big benefit of Arrow's common in-memory format is that different tools can operate on the same memory. Unfortunately we're pretty closed off in the browser, but node doesn't have that problem! Finishing ARROW-1700, node.js Plasma store client should make this type of interaction possible.

Have an idea? Tell us! Generally JIRAs are preferred but we'll take GitHub issues too. If you just want to discuss something, reach out on the mailing list or slack. But PRs are the best of all, we can always use more contributors!


## Feature Completeness

Ideally each Apache Arrow language binding would offer the same set of features, at least to the extent that the language/platform in question allows. In practice however, not all features have been implemented in all language bindings.

In comparison with the C++ Arrow API bindings, there are some missing features in the JavaScript bindings:

- Tensors are not yet supported.
- No explicit support for Apache Arrow Flight
