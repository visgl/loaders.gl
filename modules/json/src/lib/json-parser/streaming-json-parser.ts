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
  private jsonPaths: JSONPath[];
  private streamingJsonPath: JSONPath | null = null;
  private streamingArray: any[] | null = null;
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
      onopenobject: (name) => {
        if (!this.topLevelObject) {
          this.topLevelObject = {};
          this._openObject(this.topLevelObject);
        } else {
          this._openObject({});
        }
        if (typeof name !== 'undefined') {
          this.parser.emit('onkey', name);
        }
      }
    });
    const jsonpaths = options.jsonpaths || [];
    this.jsonPaths = jsonpaths.map((jsonpath) => new JSONPath(jsonpath));
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
    let array: any[] = [];
    if (this.streamingArray) {
      array = [...this.streamingArray];
      this.streamingArray.length = 0;
    }
    return array;
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
