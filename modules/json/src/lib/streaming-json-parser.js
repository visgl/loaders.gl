import {default as JSONParser} from './json-parser';

/**
 * The `StreamingJSONParser` looks for the first array in the JSON structure.
 * and emits an array of chunks
 */
export default class StreamingJSONParser extends JSONParser {
  constructor() {
    super();
    this._extendParser();
  }

  // Redefine write to clear top-level array and return batch of rows
  write(chunk) {
    super.write(chunk);
    let array = [];
    if (this.topLevelArray) {
      array = [...this.topLevelArray];
      this.topLevelArray.length = 0;
    }
    return array;
  }

  // PRIVATE METHODS

  _extendParser() {
    // Redefine onopenarray to locate top-level array
    this.parser.onopenarray = () => {
      if (!this.topLevelArray) {
        this.topLevelArray = [];
        this._openContainer(this.topLevelArray);
      } else {
        this._openContainer([]);
      }
    };
  }
}
