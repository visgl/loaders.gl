# Streaming

> Streaming support in loaders.gl is a work-in-progress. The ambition is that many loaders would support streaming from both Node and DOM streams, through a consistent API and set of conventions (for both applications and loader/writer objects).

## Streaming Loads

### Incremental Parsing

Some loaders offer incremental parsing (chunks of incomplete data can be parsed, and updates will be sent after a certain batch size has been exceeded). In many cases, parsing is fast compared to loading of data, so incremental parsing on its own may not provide a lot of value for applications.

### Incremental Loading

Incremental parsing becomes more interesting when it can be powered by incremental loading, whether through request updates or streams (see below).

### Streamed Loading

Streamed loading means that the entire data does not need to be loaded.

This is particularly advantageous when:

- loading files with sizes that exceed browser limits (e.g. 1GB in Chrome)
- doing local processing to files (tranforming one row at a time), this allows pipe constructions that can process files that far exceed internal memory.

## Batched Updates

For incemental loading and parsing to be really effective, the application needs to be able to deal efficiently with partial batches as they arrive. Each loader category (or loader) may define a batch update conventions that are appropriate for the format being loaded.

## Streaming Writes

TBA

## Node Streams vs DOM Streams

Stream support is finally arriving in browsers, however DOM Streams have a slightly different API than Node streams and the support across browsers is still spotty.

## Polyfills

Stream support across browsers can be somewhat improved with polyfills. TBA

## Stream Utilities

- Stream to memory, ...
- Automatically create stream if loader/writer only supports streaming
- ...
