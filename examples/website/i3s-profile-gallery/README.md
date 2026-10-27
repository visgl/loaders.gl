# I3S profile gallery

This example is a metadata-first companion to the I3S rendering examples. Paste an ArcGIS
SceneServer layer URL to inspect its normalized profile, version, CRS, capabilities, and feature
support report. The gallery deliberately does not evaluate Arcade, renderers, or popups; those
remain application-layer responsibilities. The example is implemented with native DOM APIs and
does not depend on React; the website supplies a small React adapter only to mount it in the docs.

```bash
yarn
yarn start
```
