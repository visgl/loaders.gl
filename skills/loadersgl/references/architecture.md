# Architecture

`@loaders.gl/core` orchestrates application loading and parsing. Format packages
own loader metadata, options and parser implementations. `loader-utils` owns
shared low-level support and `worker-utils` owns worker infrastructure.

Inspect exports in the installed package. Metadata loaders recognize formats and
can expose `preload()` for async core APIs; sync parsing requires parser-bearing
loaders from explicit implementation subpaths. Use `modules/csv` as the reference
for new repository modules; do not export `*WithParser` loaders from metadata roots.
Keep constants and shared types in neutral files to avoid import cycles.

Check the format's result type and namespaced options. Tables, meshes, images,
scenegraphs and tile sources have different contracts. Choose the output shape
needed downstream rather than casting an unexpected result to fit.

Published format modules must not import core from their source. Move shared
helpers downward or inject dependencies. The deck-layers module is the exception.
