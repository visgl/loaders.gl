# PotreeLoader

Work in progress.

For multi-step point-cloud access, prefer `PotreeSource`. See
[PotreeSource](./potree-source.md).

## PotreeSource

`PotreeSource` creates a point-cloud node source from either a legacy Potree `cloud.js`
dataset or a PotreeConverter 2.x `metadata.json` dataset.

```typescript
import {PotreeSource} from '@loaders.gl/potree';

const source = PotreeSource.createDataSource('/pointcloud/metadata.json', {
  tileRangeRequest: {
    batchDelayMs: 50,
    rangeExpansionBytes: 65536
  }
});

await source.init();
const rootNode = await source.loadNodeContent('r');
```

### PotreeConverter 2.x Range Requests

PotreeConverter 2.x stores point nodes in `octree.bin` and node metadata in
`hierarchy.bin`. For URL sources, loaders.gl reads both files with HTTP byte ranges.

`loadNodeContent()` calls made during the same `tileRangeRequest.batchDelayMs` window are
started together. Nearby ranges in `octree.bin` are expanded and merged according to
`tileRangeRequest.rangeExpansionBytes`, capped by `tileRangeRequest.maxMergedBytes`, then
carved back into the requested nodes before decode.

## Options

| Option                                | Type     | Default | Description                                                                |
| ------------------------------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `tileRangeRequest.batchDelayMs`       | `number` | `50`    | Time to wait for sibling point-node requests before loading point data.    |
| `tileRangeRequest.rangeExpansionBytes` | `number` | `65536` | Maximum byte gap to over-fetch when expanding one HTTP range to include nearby Potree nodes. |
| `tileRangeRequest.maxGapBytes`        | `number` | `65536` | Compatibility alias for `rangeExpansionBytes`.                             |
| `tileRangeRequest.maxMergedBytes`     | `number` | `8388608` | Maximum size of one merged byte-range request.                           |
| `tileRangeRequest.maxConcurrentRequests` | `number` | `6`  | Reserved concurrency hint for range-request transports.                    |

## Limitations

- Legacy Potree `cloud.js` datasets keep the existing file-per-node load path.
- PotreeConverter 2.x `DEFAULT` and `BROTLI` node encodings are decoded for common
  position, color, and scalar attributes.
- The current Source API exposes `loadNodeContent(nodeName)` rather than z/x/y tile
  addressing.
