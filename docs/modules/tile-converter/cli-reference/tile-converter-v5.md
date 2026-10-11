---
title: Tile-converter v5 CLI
description: Bounded metadata inspection of explicit 3D Tiles JSON and local 3TZ archives.
---

# Tile-converter v5 CLI

The experimental `tile-converter-v5` command starts the v5 Node workflow with
metadata-only inspection. Install `@loaders.gl/tile-converter` to use its binary.
The original `tile-converter` command remains the v4 conversion CLI.

```sh
tile-converter-v5 inspect ./dataset/tileset.json
tile-converter-v5 inspect https://example.com/tileset.json
tile-converter-v5 inspect ./dataset.3tz --input-format 3tz
```

`inspect` accepts one input. It outputs the parsed explicit 3D Tiles 1.0/1.1 document,
metadata byte count and ordered resource declarations, including placement IDs, URIs,
tile paths and combined transforms. Local roots use a synthetic URL for confined resource
resolution; the `input` field retains the supplied path. No geometry, texture or attribute
payload is loaded. Missing payload files therefore do not fail metadata inspection.

| Option | Default | Purpose |
| --- | --- | --- |
| `--input-format` | `3d-tiles` | `3d-tiles` for JSON, or `3tz` for a local archive |
| `--max-input-bytes` | `16777216` | Lower the 16 MiB response/indexed-read budget |
| `--max-resources` | `1000` | Lower the explicit content-placement limit |
| `--help` | | Show usage |

Limits must be positive decimal integers within those ceilings. Inspection also caps local
archive file size and indexed read bytes. Local resources are confined to the root document's
real directory or selected archive. HTTP(S) JSON roots must fit the response budget.

Successful inspection writes JSON to stdout and exits zero. Invalid arguments, unreadable
inputs, unsupported documents and exceeded budgets write a JSON error to stderr and exit
nonzero. SIGINT cancels inspection cooperatively and releases its reader. Help prints text.

This is not a content validator or conversion command. Implicit tiling is rejected and
nested tilesets are not expanded. I3S/SLPK, remote archive inputs, output storage/services,
full-content validation and installed Windows qualification are follow-ups. See the
[v5 source API](/docs/modules/tile-converter/api-reference/v5-conversion#node-inspection-and-raw-content-reads)
for bounded raw reads and source cleanup.
