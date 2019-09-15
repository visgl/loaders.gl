# Iterator Utilities

## Functions

### getStreamIterator(stream : Stream) : AsyncIterator

Returns an async iterator that can be used to read chunks of data from the stream (or write chunks of data to the stream, in case of writable streams).

Works on both Node.js 8+ and browser streams.
