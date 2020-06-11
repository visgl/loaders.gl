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

  // PRIVATE METHODS

  _extendParser() {
    // Redefine onopenarray to locate top-level array
    this.parser.onopenarray = () => {
      debugger
      this.path.push(0);
      console.error(this.path);
      if (!this.topLevelArray) {
        this.topLevelArray = [];
        this._openContainer(this.topLevelArray);
      } else {
        this._openContainer([]);
      }
    };

    this.parser.onclosearray = () => {
      this.path.pop();
      console.error(this.path);
    };

    this.parser.onopenobject = name => {
      this.path.push(name);
      console.error(this.path);

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

    this.parser.onkey = name => {
      this.path[this.path.length] = name;
      console.error(this.path);
    };

    this.parser.oncloseobject = () => {
      this.path.pop();
      console.error(this.path);
    };
  }
}
