# Spark Streaming LoD Example

Standalone Spark 2.0 streaming LoD example adapted from the upstream Spark
[`streaming-lod`](https://github.com/sparkjsdev/spark/tree/main/examples/streaming-lod)
example.

```bash
yarn
yarn start
```

The sample scenes stream prebuilt `.rad` LoD assets from Spark's public example storage.
The app also preflights each `.rad` URL through `@loaders.gl/splats` `RADSourceLoader`
so the vis.gl loader path validates the RAD header and chunk table before Spark streams
the chunk payloads.
