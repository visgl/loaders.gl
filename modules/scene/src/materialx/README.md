# MaterialX parser

Native XML parsing implementation for browsers and Node.js. `parseMaterialX` returns an ordered element tree retaining string attributes, named connections, custom node categories and unresolved includes. It rejects malformed XML, document types, and missing or unsupported major versions.

This implementation does not resolve libraries, validate MaterialX node signatures, evaluate graphs, or generate shaders. The scene package exports MaterialXLoader with a materialx-loader implementation subpath.
