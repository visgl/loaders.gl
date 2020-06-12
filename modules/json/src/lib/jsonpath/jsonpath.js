/**
 * A parser for a minimal subset of the jsonpath standard
 * Full JSON path parsers for JS exist but are quite large (bundle size)
 * 
 * Supports
 * 
 *   `$.component.component.component`
 */
export default class JSONPath {
  constructor(pathstring = null) {
    this.path = [];

    if (pathstring) {
      const components = pathstring.split('.');
      if (components[0] !== '$') {
        throw new Error('JSONPaths must start with $');
      }
      components.shift();
    }
  }

  push() {
    this.path.push();
  }

  pop() {
    this.path.pop();
  }

  equals(other) {
    if (!this || !other || this.path.length !== other.path.length) {
      return false;
    }

    for (let i = 0; i < this.path.length; ++i) {
      if (this.path[i] !== other.path[i]) {
        return false;
      }
    }

    return true;
  }
}
