# Lance examples

> Work in progress: this example tracks the read-only Lance MVP and its API may change.

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
