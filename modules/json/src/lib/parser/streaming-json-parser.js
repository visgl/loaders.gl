import {default as JSONParser} from './json-parser';

/**
 * The `StreamingJSONParser` looks for the first array in the JSON structure.
 * and emits an array of chunks
 */
export default class StreamingJSONParser extends JSONParser {
  constructor() {
    super();
    this.path = [];
    this.topLevelArray = null;
    this.topLevelObject = null;
    this._extendParser();
  }

  // write REDEFINITION
  // - super.write() chunk to parser
  // - get the contents (so far) of "topmost-level" array as batch of rows
  // - clear top-level array
  // - return the batch of rows
  write(chunk) {
    super.write(chunk);
    let array = [];
    if (this.topLevelArray) {
      array = [...this.topLevelArray];
      this.topLevelArray.length = 0;
    }
    return array;
  }

  // Returns a partially formed result object
  // Useful for returning the "wrapper" object when array is not top level
  // e.g. GeoJSON
  getPartialResult() {
    return this.topLevelObject;
  }

  getPath() {
    return this.path;
  }

  _checkJSONPath(jsonPaths) {
    const currentPath = this.getPath();
    for (const jsonPath of jsonPaths) {
      if (jsonPath.equal(currentPath)) {
        return true;
      }
    }
  }
  // PRIVATE METHODS

  _extendParser() {
    debugger
    // Redefine onopenarray to locate and inject value for top-level array
    this.parser.onopenarray = () => {
      if (!this.topLevelArray) {
        console.debug(`Testing JSONPath`, this.getPath());
        this.topLevelArray = [];
        this._openArray(this.topLevelArray);
      } else {
        this._openArray();
      }
    };

    // Redefine onopenarray to inject value for top-level object
    this.parser.onopenobject = name => {
      if (!this.topLevelObject) {
        this.topLevelObject = {};
        this._openObject(this.topLevelObject);
      } else {
        this._openObject({});
      }
      if (typeof name !== 'undefined') {
        this.parser.onkey(name);
      }
    };
  }
}
