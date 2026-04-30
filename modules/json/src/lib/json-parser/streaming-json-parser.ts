// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {default as JSONParser} from './json-parser';
import JSONPath from '../jsonpath/jsonpath';

/**
 * The `StreamingJSONParser` looks for the first array in the JSON structure.
 * and emits an array of chunks
 */
export default class StreamingJSONParser extends JSONParser {
  /** JSONPaths that identify arrays eligible for streaming. */
  private jsonPaths: JSONPath[];
  /** JSONPath of the selected streaming array. */
  private streamingJsonPath: JSONPath | null = null;
  /** Parser-owned array for the selected streaming rows. */
  private streamingArray: any[] | null = null;
  /** Number of direct streaming-array children that are fully parsed and ready to emit. */
  private completedStreamingRowCount: number = 0;
  /** Root object used by metadata batches when streaming an embedded array. */
  private topLevelObject: object | null = null;

  constructor(options: {[key: string]: any} = {}) {
    super({
      onopenarray: () => {
        if (!this.streamingArray) {
          if (this._matchJSONPath()) {
            // @ts-ignore
            this.streamingJsonPath = this.getJsonPath().clone();
            this.streamingArray = [];
            this._openArray(this.streamingArray as []);
            return;
          }
        }

        this._openArray();
      },

      // Redefine onopenarray to inject value for top-level object
      onopenobject: name => {
        if (!this.topLevelObject) {
          this.topLevelObject = {};
          this._openObject(this.topLevelObject);
        } else {
          this._openObject({});
        }
        if (typeof name !== 'undefined') {
          this.parser.emit('onkey', name);
        }
      },

      oncloseobject: () => {
        const directStreamingChild = this._isClosingDirectStreamingChild();
        this._closeObject();
        if (directStreamingChild) {
          this.completedStreamingRowCount++;
        }
      },

      onclosearray: () => {
        const directStreamingChild = this._isClosingDirectStreamingChild();
        this._closeArray();
        if (directStreamingChild) {
          this.completedStreamingRowCount++;
        }
      },

      onvalue: value => {
        const directStreamingValue = this._isInStreamingArray();
        this._pushOrSet(value);
        if (directStreamingValue) {
          this.completedStreamingRowCount++;
        }
      }
    });
    const jsonpaths = options.jsonpaths || [];
    this.jsonPaths = jsonpaths.map(jsonpath => new JSONPath(jsonpath));
  }

  /**
   * write REDEFINITION
   * - super.write() chunk to parser
   * - get the contents (so far) of "topmost-level" array as batch of rows
   * - clear top-level array
   * - return the batch of rows\
   */
  write(chunk) {
    super.write(chunk);
    return this._drainCompletedRows();
  }

  /**
   * Returns a partially formed result object
   * Useful for returning the "wrapper" object when array is not top level
   * e.g. GeoJSON
   */
  getPartialResult() {
    return this.topLevelObject;
  }

  getStreamingJsonPath() {
    return this.streamingJsonPath;
  }

  getStreamingJsonPathAsString() {
    return this.streamingJsonPath && this.streamingJsonPath.toString();
  }

  getJsonPath() {
    return this.jsonpath;
  }

  // PRIVATE METHODS

  /**
   * Returns completed rows and removes them from the parser-owned streaming array.
   */
  _drainCompletedRows(): any[] {
    if (!this.streamingArray || this.completedStreamingRowCount === 0) {
      return [];
    }

    const rows = this.streamingArray.slice(0, this.completedStreamingRowCount);
    this.streamingArray.splice(0, this.completedStreamingRowCount);
    this.completedStreamingRowCount = 0;
    return rows;
  }

  /**
   * Checks whether the parser is currently writing a direct value into the streaming array.
   */
  _isInStreamingArray(): boolean {
    return Boolean(this.streamingArray && this.currentState.container === this.streamingArray);
  }

  /**
   * Checks whether the current close event completes a direct streaming-array child.
   */
  _isClosingDirectStreamingChild(): boolean {
    if (!this.streamingArray || this.currentState.container === this.streamingArray) {
      return false;
    }

    const parentState = (this.previousStates as Array<{container: unknown}>)[
      this.previousStates.length - 1
    ];
    return parentState?.container === this.streamingArray;
  }

  /**
   * Checks is this.getJsonPath matches the jsonpaths provided in options
   */
  _matchJSONPath() {
    const currentPath = this.getJsonPath();
    // console.debug(`Testing JSONPath`, currentPath);

    // Backwards compatibility, match any array
    // TODO implement using wildcard once that is supported
    if (this.jsonPaths.length === 0) {
      return true;
    }

    for (const jsonPath of this.jsonPaths) {
      if (jsonPath.equals(currentPath)) {
        return true;
      }
    }

    return false;
  }
}
