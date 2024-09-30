// @ts-nocheck
// A custom papaparse `Streamer` for async iterators
// Ideally this can be contributed back to papaparse
// Or papaparse can expose Streamer API so we can extend without forking.

/* eslint-disable no-invalid-this */

// Note: papaparse is not an ES6 module
import Papa from './papaparse';
const {ChunkStreamer} = Papa;

export default class AsyncIteratorStreamer extends ChunkStreamer {
  textDecoder = new TextDecoder(this._config.encoding);

  constructor(config = {}) {
    super(config);
  }

  // Implement ChunkStreamer base class methods

  // this.pause = function() {
  //   ChunkStreamer.prototype.pause.apply(this, arguments);
  // };

  // this.resume = function() {
  //   ChunkStreamer.prototype.resume.apply(this, arguments);
  //   this._input.resume();
  // };

  async stream(asyncIterator) {
    this._input = asyncIterator;

    try {
      // ES2018 version
      // TODO - check for pause and abort flags?
      for await (const chunk of asyncIterator) {
        this.parseChunk(this.getStringChunk(chunk));
      }

      // ES5 VERSION
      // while (true) {
      //   asyncIterator.next().then(function(value) {
      //     if (value.done) {
      //       // finalize iterator?
      //     }
      //   }
      //   const  = await ;
      //   if (done) return total;
      //   total += value.length;
      // }

      this._finished = true;
      this.parseChunk('');
    } catch (error) {
      // Inform ChunkStreamer base class of error
      this._sendError(error);
    }
  }

  _nextChunk() {
    // Left empty, as async iterator automatically pulls next chunk
  }

  // HELPER METHODS
  getStringChunk(chunk) {
    return typeof chunk === 'string' ? chunk : this.textDecoder.decode(chunk, {stream: true});
  }
}
