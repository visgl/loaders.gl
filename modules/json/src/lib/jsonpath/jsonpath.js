/**
 * A parser for a minimal subset of the jsonpath standard
 * Full JSON path parsers for JS exist but are quite large (bundle size)
 *
 * Supports
 *
 *   `$.component.component.component`
 */
export default class JSONPath {
  constructor(path = null) {
    this.path = ['$'];

    if (path instanceof JSONPath) {
      this.path = [...path.path];
      return;
    }

    if (Array.isArray(path)) {
      this.path.push(...path);
      return;
    }

    // Parse a string as a JSONPath
    if (typeof path === 'string') {
      this.path = path.split('.');
      if (this.path[0] !== '$') {
        throw new Error('JSONPaths must start with $');
      }
    }
  }

  clone() {
    return new JSONPath(this);
  }

  toString() {
    return this.path.join('.');
  }

  push(name) {
    this.path.push(name);
  }

  pop() {
    return this.path.pop();
  }

  set(name) {
    this.path[this.path.length - 1] = name;
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

  /**
   * Sets the value pointed at by path
   * TODO - handle root path
   * @param {*} object
   * @param {*} value
   */
  setFieldAtPath(object, value) {
    const path = [...this.path];
    path.shift();
    const field = path.pop();
    for (const component of path) {
      object = object[component];
    }
    object[field] = value;
  }

  /**
   * Gets the value pointed at by path
   * TODO - handle root path
   * @param {*} object
   */
  getFieldAtPath(object) {
    const path = [...this.path];
    path.shift();
    const field = path.pop();
    for (const component of path) {
      object = object[component];
    }
    return object[field];
  }
}
