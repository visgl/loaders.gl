# Lance examples

> Work in progress: this example tracks the read-only Lance MVP and its API may change.

The first example is fully local and demonstrates the current read-only MVP:

```bash
node examples/lance/flat-arrow.mjs
```

It prints three rows from a minimal Lance data file as an Arrow table.

The second example reads metadata from the public
[LAION-1M Lance dataset on Hugging Face](https://huggingface.co/datasets/lance-format/laion-1m):

```bash
node examples/lance/huggingface-laion-1m.mjs
```

That dataset is a million-scale multimodal table with image blobs, captions,
and embeddings. The current decoder reports its manifest and schema, while
Arrow row scanning for those richer column encodings remains a subsequent
tranche. The example pins manifest version `3`; Hugging Face exposes numbered
manifests for this dataset rather than a latest-version hint. Production
manifest compatibility is supported; production row decoding for the richer
column types is the next required decoder tranche. It now fetches five real
rows from the `similarity`, `width`, and `height` scalar columns using HTTP
range requests and displays them as Arrow data.

To run the working MVP in a browser:

```bash
yarn vite --config examples/lance/browser/vite.config.ts
```

Then open http://127.0.0.1:5173.

The browser example includes a curated Hugging Face picker for LAION-1M,
CIFAR-10, ADE20K, and LeRobot PushT. Select a source to populate its Lance URL and manifest
version, or choose `Custom Lance URL` and enter another dataset root. LAION-1M
currently supports paged scalar columns as Arrow; the other curated sources
load their manifests and schema while image/blob decoding is still pending.

PushT additionally reads its two-element `observation_state` coordinate column
and renders a sampled trajectory with deck.gl's orthographic view. These are
robot-workspace coordinates, not longitude/latitude.
