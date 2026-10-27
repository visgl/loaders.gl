---
title: Constants
description: Branch-specific loaders.gl repository URLs and worker distribution tag.
---

# Constants

Import lightweight branch configuration without importing the core API:

```typescript
import {
  LOADERS_GL_FIXTURE_BRANCH,
  LOADERS_GL_RAW_FIXTURE_URL,
  LOADERS_GL_REDIRECTING_FIXTURE_URL,
  NPM_TAG
} from '@loaders.gl/core/constants';
```

`LOADERS_GL_FIXTURE_BRANCH` identifies the repository branch used by the raw GitHub URLs. Both URLs point to the repository root and end in a slash. `NPM_TAG` is the fallback distribution tag for workers when a build has no injected package version: `beta` on master and `latest` on release branches. Published worker descriptors normally use their exact package version.
