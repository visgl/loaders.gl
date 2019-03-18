/* eslint-disable no-invalid-this */
/* global TextDecoder */

// TODO - sort out import mess
import Papa from './papaparse';
const {ChunkStreamer} = Papa;

function bindFunction(f, self) {
  return function() {
    f.apply(self, arguments);
  };
}

export default function AsyncIteratorStreamer(config) {
  config = config || {};

  ChunkStreamer.call(this, config);

  this.textDecoder = new TextDecoder(this._config.encoding);
  const queue = [];
  let parseOnData = true;
  let streamHasEnded = false;

  // this.pause = function() {
  //   ChunkStreamer.prototype.pause.apply(this, arguments);
  // };

  // this.resume = function() {
  //   ChunkStreamer.prototype.resume.apply(this, arguments);
  //   this._input.resume();
  // };

  this.stream = async function(asyncIterator) {
    this._input = asyncIterator;

    try {
      // TODO - check for abort flag?
      for await (const chunk of asyncIterator) {
        this._streamData(chunk);
      }
    } catch (error) {
      this._streamError(error);
    } finally {
      this._streamEnd();
    }
  };

  this._checkIsFinished = function() {
    if (streamHasEnded && queue.length === 1) {
      this._finished = true;
    }
  };

  this._nextChunk = function() {
    this._checkIsFinished();
    if (queue.length) {
      this.parseChunk(queue.shift());
    } else {
      parseOnData = true;
    }
  };

  this._streamData = bindFunction(function(chunk) {
    try {
      let stringChunk = chunk;
      if (typeof chunk !== 'string') {
        stringChunk = this.textDecoder.decode(chunk, {stream: true});
      }
      queue.push(stringChunk);

      if (parseOnData) {
        parseOnData = false;
        this._checkIsFinished();
        this.parseChunk(queue.shift());
      }
    } catch (error) {
      this._streamError(error);
    }
  }, this);

  this._streamError = bindFunction(function(error) {
    // this._streamCleanUp();
    this._sendError(error);
  }, this);

  this._streamEnd = bindFunction(function() {
    // this._streamCleanUp();
    streamHasEnded = true;
    this._streamData('');
  }, this);

  // this._streamCleanUp = bindFunction(function() {
  // }, this);
}

AsyncIteratorStreamer.prototype = Object.create(ChunkStreamer.prototype);
AsyncIteratorStreamer.prototype.constructor = AsyncIteratorStreamer;
