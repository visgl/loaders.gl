---
title: TAR
---

`@loaders.gl/archives/tar` exports `TarLoader`, `TarWriter`, `TarBuilder`, and `readTarArchive`. Import `TarLoaderWithParser` from `@loaders.gl/archives/tar/tar-loader` for synchronous parser access; the metadata loader loads it through `preload()`.

```ts
import {TarLoader, TarWriter} from '@loaders.gl/archives/tar';
import {load, encode} from '@loaders.gl/core';

const files = await load(tarData, TarLoader);
const archive = await encode({'hello.txt': 'Hello!'}, TarWriter);
```

The reader supports uncompressed ustar regular files and directories. It validates header checksums and paths, rejects links and unsupported extensions, and limits entries to 100,000 and retained file bytes to 64 MiB by default. Set `tar.maxEntries` and `tar.maxTotalDecodedBytes` to change those limits.

`TarWriter` writes deterministic ustar archives with UTF-8 file names and splits long paths across the prefix and name fields. Paths that cannot fit those fields are rejected. A trailing slash writes a directory entry.
