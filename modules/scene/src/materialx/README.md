# MaterialX parser

Initial browser-only XML parsing implementation. `parseMaterialX` returns an ordered element tree retaining string attributes, named connections, custom node categories and unresolved includes. It rejects malformed XML, document types, and missing or unsupported major versions.

This implementation does not resolve libraries, validate MaterialX node signatures, evaluate graphs, or generate shaders. Node.js support and public loader entrypoints remain follow-up work.
