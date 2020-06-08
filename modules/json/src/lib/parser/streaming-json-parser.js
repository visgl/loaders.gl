import {default as JSONParser} from './json-parser';

/**
 * The `StreamingJSONParser` looks for the first array in the JSON structure.
 * and emits an array of chunks
 */
export default class StreamingJSONParser extends JSONParser {
  constructor() {
    super();
    this.topLevelArray = null;
    this.topLevelArrayDepth = null;
    this.topLevelArrayPositions = null;
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
    let cursors = [];
    if (this.topLevelArray) {
      array = [...this.topLevelArray];
      cursors = this.topLevelArrayPositions ? [...this.topLevelArrayPositions] : [];
      this.topLevelArray.length = 0;
      this.topLevelArrayPositions.length = 0;
    }
    return {rows: array, cursors};
  }

  // Returns a partially formed result object
  // Useful for returning the "wrapper" object when array is not top level
  // e.g. GeoJSON
  getPartialResult() {
    return this.topLevelObject;
  }

  // PRIVATE METHODS
  _extendParser() {
    // Redefine onopenarray to locate top-level array
    this.parser.onopenarray = () => {
      if (!this.topLevelArray) {
        this.topLevelArray = [];
        this.topLevelArrayPositions = [];
        this.topLevelArrayDepth = this.parser.depth + 1;
        this._openContainer(this.topLevelArray);
      } else {
        this._openContainer([]);
      }
    };

    this.parser.onopenobject = name => {
      if (!this.topLevelObject) {
        this.topLevelObject = {};
        this._openContainer(this.topLevelObject);
      } else {
        this._openContainer({});
      }
      if (typeof name !== 'undefined') {
        this.parser.onkey(name);
      }
    };

    this.parser.oncloseobject = () => {
      this._closeContainer();
      if (this.parser.depth === this.topLevelArrayDepth + 1) {
        this.topLevelArrayPositions.push(this.parser.position);
      }
    };
  }
}
